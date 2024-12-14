import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet , Alert} from 'react-native';
import { useWindowDimensions } from 'react-native';
import useChess from '../hooks/useChess';
import EmptyBoard from './EmptyBoard';
import Moves from './Moves';
import Pieces from './Pieces';
import {Auth} from '../app/src/auth'
import { io, Socket } from 'socket.io-client';



const useRandomMove = (chess: any, socket: Socket | null, gameId: any) => {
    while (!chess.isGameOver() && chess.turn() === 'b') {
        const moves = chess.moves({ verbose: true });
        const move = moves[Math.floor(Math.random() * moves.length)];
        console.log("move:", move);
        chess.move(move);
        if (socket) {
            const formattedMove = `${move.from}${move.to}`;
            socket.emit('opponentMove',{ gameId: gameId, formattedMove });
        }
    }
};

interface ChessBoardProps {
    gameId: string | null;
    auth: Auth;
}

const SERVER_URL = 'http://192.168.98.16:5000';

const ChessBoard: React.FC<ChessBoardProps> = ({ gameId, auth }) => {
    const { width } = useWindowDimensions();
    const chess = useChess();
    const [visibleMoves, setVisibleMoves] = useState<any[]>([]);
    const boardSize = Math.min(width, 400);
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        const openStream = async () => {
            try {
                console.log("Attempting to open stream...");
                const stream = await auth.openStream(`/api/board/game/stream/${gameId}`, {});
                console.log("Stream opened:", stream);
                stream.closePromise.then(() => console.log("Stream closed"));
            } catch (error) {
                console.error("Error opening stream:", error);
            }
        };
        if (gameId) {
            console.log("Game ID available, opening stream...");
            openStream();
        } else {
            console.log("No Game ID, stream not opened.");
        }
        console.log('Initializing socket');
        socketRef.current = io(SERVER_URL);

        const socket = socketRef.current;

        socket.on('connect', () => {
            console.log('Socket connected:', socket.id);
            if (gameId) {
                socket.emit('join', gameId);
            }
        });

        socket.on('connect_error', (error) => {
            console.error('Connection error:', error);
            Alert.alert('Connection Error', 'Failed to connect to the game server. Please check your network connection and try again.');
        });

        socket.on('disconnect', () => {
            console.log('Socket disconnected');
        });

        useRandomMove(chess, socket, gameId);

    }, [gameId, auth, chess]);

    useRandomMove(chess, socketRef.current, gameId);

    useEffect(() => {
        if (gameId) {
            // Fetch game state and update chess instance
        }
    }, [gameId]);

    const handleSelectPiece = useCallback((square: any) => {
        if (chess) {
            const moves = chess.moves({ square: square, verbose: true });
            setVisibleMoves(moves);
        }
    }, [chess]);

    const handleSelectMove = useCallback(async (move: any) => {
        console.log("Selected move:", move);
        try {
            const res = await auth.fetchBody(`/api/board/game/${gameId}/move/${move.from}${move.to}`, { method: 'post' });
            console.log("Move response:", res);
            if (chess) {
                chess.move(move.promotion ? { ...move, promotion: 'q' } : move);
                setVisibleMoves([]);
            }
        } catch (error) {
            console.error("Error making move:", error);
        }
    }, [chess, auth, gameId]);

    if (!chess) {
        return null;
    }

    return (
        <View style={styles.container}>
            <EmptyBoard size={boardSize} />
            <Pieces board={chess.board()} onSelectPiece={handleSelectPiece} size={boardSize} />
            <Moves visibleMoves={visibleMoves} onSelectMove={handleSelectMove} size={boardSize} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'relative',
    },
});

export default ChessBoard;

