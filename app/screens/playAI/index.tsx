import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Modal, FlatList, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebView } from 'react-native-webview';
import { readStream, Stream } from '../../src/ndJsonStream';

const getAuthState = async () => {
  const authStateString = await AsyncStorage.getItem('authState');
  const authState = authStateString ? JSON.parse(authStateString) : null;
  let token = '';
  if (authState) token = authState.accessToken;
  return token;
};

let token = '';

const AI_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function AIGame() {
  const [gameId, setGameId] = useState<string | null>(null);
  const [aiLevel, setAiLevel] = useState('3');
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [playInWebView, setPlayInWebView] = useState(false);
  const streamRef = useRef<Stream | null>(null);

  useEffect(() => {
    const fetchToken = async () => {
      token = await getAuthState();
    };
    fetchToken();
  }, []);

  useEffect(() => {
    if (gameId) {
      streamGameMoves();
    }
    return () => {
      if (streamRef.current) {
        streamRef.current.close();
      }
    };
  }, [gameId]);

  const createAiChallenge = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://lichess.org/api/challenge/ai', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `level=${encodeURIComponent(aiLevel)}&clock.limit=${encodeURIComponent('300')}&clock.increment=${encodeURIComponent('3')}&color=${encodeURIComponent('random')}`
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create challenge');
      }

      setGameId(data.id);
      setPlayInWebView(true);
      console.log('Game created:', data.id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setErrorMessage(errorMessage);
      console.error('Detailed error:', error);
      Alert.alert('Error', 'Failed to create AI challenge. Please check the error details below.');
    } finally {
      setLoading(false);
    }
  };

  const cancelChallenge = async () => {
    if (!gameId) return;

    try {
      const response = await fetch(`https://lichess.org/api/challenge/${gameId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to cancel challenge');
      }

      setGameId(null);
      setPlayInWebView(false);
      Alert.alert('Success', 'Challenge cancelled');
      console.log('Challenge cancelled');
    } catch (error) {
      Alert.alert('Error', 'Failed to cancel challenge');
      console.error(error);
    }
  };

  const streamGameMoves = async () => {
    if (!gameId) return;

    try {
      const response = await fetch(`https://lichess.org/api/board/game/stream/${gameId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to stream game moves');
      }

      streamRef.current = readStream('Game moves', response, (data) => {
        if (data.type === 'gameState') {
          console.log('Game move:', data.moves);
        }
      });

      await streamRef.current.closePromise;
    } catch (error) {
      console.error('Error streaming game moves:', error);
    }
  };

  if (playInWebView && gameId) {
    return (
      <WebView
        source={{ uri: `https://lichess.org/${gameId}` }}
        style={{ flex: 1 }}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          Alert.alert('WebView error', nativeEvent.description);
        }}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#0000ff" />
          </View>
        )}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.selectContainer}>
          <Text style={styles.label}>AI Level (1-8)</Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setModalVisible(true)}
          >
            <Text>{`Level ${aiLevel}`}</Text>
          </TouchableOpacity>
        </View>

        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalView}>
            <FlatList
              data={AI_LEVELS}
              keyExtractor={(item) => item.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setAiLevel(item.toString());
                    setModalVisible(false);
                  }}
                >
                  <Text>{`Level ${item}`}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </Modal>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            onPress={createAiChallenge}
            disabled={loading}
            style={[styles.button, loading && styles.disabledButton]}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>Challenge AI</Text>
            )}
          </TouchableOpacity>

          {gameId && (
            <TouchableOpacity
              onPress={cancelChallenge}
              style={[styles.button, styles.cancelButton]}
            >
              <Text style={styles.buttonText}>Cancel Challenge</Text>
            </TouchableOpacity>
          )}
        </View>

        {gameId && (
          <View style={styles.gameInfo}>
            <Text style={styles.gameIdText}>Game ID: {gameId}</Text>
            <Text style={styles.gameLink}>
              Play at: https://lichess.org/{gameId}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  content: {
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  selectContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  dropdown: {
    height: 50,
    width: '100%',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  buttonContainer: {
    marginTop: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  disabledButton: {
    backgroundColor: '#A0A0A0',
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  gameInfo: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  gameIdText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  gameLink: {
    fontSize: 14,
    color: '#666',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  modalItem: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#cccccc',
  },
});