// ND-JSON response streamer
// See https://lichess.org/api#section/Introduction/Streaming-with-ND-JSON

type Handler = (line: any) => void;

export interface Stream {
  closePromise: Promise<void>;
  close(): Promise<void>;
}

export const readStream = (name: string, response: Response): Stream => {
  if (!response.body) {
    throw new Error('Response body is undefined');
  }

  const stream = response.body.getReader();
  const matcher = /\r?\n/;
  const decoder = new TextDecoder();
  let buf = '';

  const process = (json: string) => {
    const msg = JSON.parse(json);
    console.log(name, msg);
  };

  const loop: () => Promise<void> = () =>
    stream.read().then(({ done, value }) => {
      console.log("Stream read:", { done, value });
      if (done) {
        console.log("Stream done");
        if (buf.length > 0) process(buf);
        return;
      } else {
        const chunk = decoder.decode(value, {
          stream: true,
        });
        console.log("Chunk received:", chunk);
        buf += chunk;

        const parts = buf.split(matcher);
        buf = parts.pop() || '';
        for (const i of parts.filter(p => p)) process(i);
        return loop();
      }
    }).catch(error => {
      console.error("Error reading stream:", error);
    });

  return {
    closePromise: loop(),
    close: () => stream.cancel(),
  };
};
