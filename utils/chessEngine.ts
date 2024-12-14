import { WebView } from 'react-native-webview';

const stockfishJS = `
  https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js
`;

export const initializeEngine = (webViewRef: React.RefObject<WebView>) => {
  webViewRef.current?.injectJavaScript(`
    if (typeof STOCKFISH === "function") {
      window.engine = STOCKFISH();
      window.engine.onmessage = function(event) {
        const message = event.data;
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'engineMessage', message }));
      };
      window.engine.postMessage('uci');
      window.engine.postMessage('isready');
    }
  `);
};

export const makeMove = (webViewRef: React.RefObject<WebView>, fen: string) => {
  webViewRef.current?.injectJavaScript(`
    window.engine.postMessage('position fen ${fen}');
    window.engine.postMessage('go depth 15');
  `);
};

export const parseEngineMove = (message: string): string | null => {
  const match = message.match(/bestmove\s+(\S+)/);
  return match ? match[1] : null;
};

