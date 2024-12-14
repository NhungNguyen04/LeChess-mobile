import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Chessboard, { ChessboardRef } from 'react-native-chessboard';
import { WebView } from 'react-native-webview';
import ChessBoard from '@/components/ChessBoard';

export default function AIGame() {

  return (
    <View>
      <ChessBoard/>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
  },
  button: {
    backgroundColor: '#344e41',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusText: {
    fontSize: 16,
    marginBottom: 10,
  },
  movesContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
  },
  movesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  moveText: {
    fontSize: 14,
    marginBottom: 4,
  },
});

