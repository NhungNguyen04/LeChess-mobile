import { useState } from 'react';
import { Chess } from 'chess.js';

const useChess = () => {
    const [chessInstance] = useState<Chess | undefined>(new Chess());

    return chessInstance;
};

export default useChess;
