import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';

interface Move {
    to: string;
    captured?: boolean;
    promotion?: string;
}

interface MovesProps {
    visibleMoves: Move[];
    size: number;
    onSelectMove: (move: Move) => void;
}

const Moves: React.FC<MovesProps> = ({ visibleMoves, size, onSelectMove }) => {
    const cellSize = size / 8;

    return (
        <>
            {visibleMoves.map((move) => {
                const { to, captured } = move;
                const [file, rank] = to.split('');
                const left = (file.charCodeAt(0) - 'a'.charCodeAt(0)) * cellSize;
                const bottom = (parseInt(rank) - 1) * cellSize;
                
                return (
                    <TouchableOpacity
                        key={`move-${to}`}
                        style={[
                            styles.moveIndicator,
                            {
                                width: cellSize,
                                height: cellSize,
                                left,
                                bottom,
                            },
                        ]}
                        onPress={() => onSelectMove(move)}
                    >
                        <View
                            style={[
                                styles.indicator,
                                captured ? styles.captureIndicator : styles.moveCircle,
                            ]}
                        />
                    </TouchableOpacity>
                );
            })}
        </>
    );
};

const styles = StyleSheet.create({
    moveIndicator: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
    },
    indicator: {
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },
    moveCircle: {
        width: '30%',
        height: '30%',
        borderRadius: 50,
    },
    captureIndicator: {
        width: '70%',
        height: '70%',
        borderRadius: 50,
        borderWidth: 2,
        borderColor: 'rgba(0, 0, 0, 0.3)',
        backgroundColor: 'transparent',
    },
});

export default Moves;

