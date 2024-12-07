import React from 'react';
import { View, Image, TouchableOpacity, StyleSheet } from 'react-native';
import PieceImages from '../assets/images/pieces';

interface Piece {
    square: string;
    type: string;
    color: string;
}

interface PiecesProps {
    board: (Piece | null)[][];
    size: number;
    onSelectPiece: (square: string) => void;
}

const Pieces: React.FC<PiecesProps> = ({ board, size, onSelectPiece }) => {
    const cellSize = size / 8;

    return (
        <>
            {board.flat().filter(Boolean).map((piece) => {
                if (!piece) return null;
                const { square, type, color } = piece;
                const [file, rank] = square.split('');
                const left = (file.charCodeAt(0) - 'a'.charCodeAt(0)) * cellSize;
                const bottom = (parseInt(rank) - 1) * cellSize;

                return (
                    <TouchableOpacity
                        key={`piece-${square}`}
                        style={[
                            styles.pieceContainer,
                            {
                                width: cellSize,
                                height: cellSize,
                                left,
                                bottom,
                            },
                        ]}
                        onPress={() => onSelectPiece(square)}
                    >
                        <Image
                            style={styles.pieceImage}
                            source={PieceImages[`${color}${type}`.toUpperCase() as keyof typeof PieceImages]}
                            resizeMode="contain"
                        />
                    </TouchableOpacity>
                );
            })}
        </>
    );
};

const styles = StyleSheet.create({
    pieceContainer: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
    },
    pieceImage: {
        width: '90%',
        height: '90%',
    },
});

export default Pieces;

