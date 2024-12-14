import EventSource from "react-native-sse";

type Handler = (line: any) => void;

export interface Stream {
  closePromise: Promise<void>;
  close(): void;
}

export const readStream = (name: string, url: string, headers: Record<string, string>, handler: Handler): Stream => {
  const es = new EventSource(url, { headers });
    es.addEventListener('open', () => {
      console.log(name, 'connected');
      console.log('es', es);
      handler(es);
    });
  es.addEventListener('message', (event) => {
    try {
      const msg = JSON.parse(event.data);
      console.log(name, msg);
      handler(msg);
    } catch (error) {
      console.error('Error parsing SSE data:', error);
    }
  });

  es.addEventListener('error', (error) => {
    console.error('SSE error:', error);
  });

  return {
    closePromise: new Promise((resolve) => {
      es.addEventListener('close', () => {
        resolve();
      });
    }),
    close: () => {
      es.close();
    },
  };
};

