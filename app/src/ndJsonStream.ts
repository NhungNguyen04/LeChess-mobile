
type Handler = (data: any) => void;

export interface Stream {
  closePromise: Promise<void>;
  close(): void;
}

export const readStream = (url: string, token: string, handler: Handler): Stream => {
  let closed = false;
  let controller: AbortController | null = null;

  const closePromise = new Promise<void>((resolve) => {
    const fetchStream = async () => {
      try {
        controller = new AbortController();
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/x-ndjson',
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (!closed) {
          const { value, done } = await reader.read();
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.trim()) {
              try {
                const data = JSON.parse(line);
                handler(data);
              } catch (e) {
                console.error('Error parsing JSON:', e);
              }
            }
          }
        }
      } catch (error) {
        if (!closed) {
          console.error('Stream error:', error);
          // Attempt to reconnect after a delay
          setTimeout(fetchStream, 5000);
        }
      }
    };

    fetchStream();
  });

  return {
    closePromise,
    close: () => {
      closed = true;
      if (controller) {
        controller.abort();
      }
    },
  };
};

