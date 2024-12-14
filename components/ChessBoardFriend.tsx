import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet , Alert} from 'react-native';
import { useWindowDimensions } from 'react-native';
import useChess from '../hooks/useChess';
import EmptyBoard from './EmptyBoard';
import Moves from './Moves';
import Pieces from './Pieces';
import {Auth} from '../app/src/auth'
import { io, Socket } from 'socket.io-client';


const SERVER_URL = 'http://192.168.98.16:5000';

const ChessBoard: React.FC = () => {
    const { width } = useWindowDimensions();
    const chess = useChess();
    const [visibleMoves, setVisibleMoves] = useState<any[]>([]);
    const boardSize = Math.min(width, 400);
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        console.log('Initializing socket');
        socketRef.current = io(SERVER_URL);

        const socket = socketRef.current;

        socket.on('connect', () => {
            console.log('Socket connected:', socket.id);
            
        });

        socket.on('connect_error', (error) => {
            console.error('Connection error:', error);
            Alert.alert('Connection Error', 'Failed to connect to the game server. Please check your network connection and try again.');
        });

        socket.on('disconnect', () => {
            console.log('Socket disconnected');
        });


    }, [ chess]);



    const handleSelectPiece = useCallback((square: any) => {
        if (chess) {
            const moves = chess.moves({ square: square, verbose: true });
            setVisibleMoves(moves);
        }
    }, [chess]);

    const handleSelectMove = useCallback(async (move: any) => {
        console.log("Selected move:", move);
        try {
            if (chess) {
                chess.move(move.promotion ? { ...move, promotion: 'q' } : move);
                setVisibleMoves([]);
            }
        } catch (error) {
            console.error("Error making move:", error);
        }
    }, [chess]);

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

