import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Modal, FlatList, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Chessboard, {ChessboardRef} from 'react-native-chessboard';
import { Auth } from '../../src/auth';

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
  const streamRef = useRef<{ closePromise: Promise<void>; close: () => void } | null>(null);
  const [auth, setAuth] = useState<Auth | null>(null);

  useEffect(() => {
    const fetchToken = async () => {
      token = await getAuthState();
      const authInstance = new Auth();
      await authInstance.init();
      setAuth(authInstance);
    };
    fetchToken();
  }, []);

  const [gameState, setGameState] = useState<any>(null);
  const [streamError, setStreamError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const openStreamConnection = async () => {
      if (auth && gameId) {
        try {
          const handleStreamMessage = (msg: any) => {
            console.log('Stream message:', msg);
            setGameState((prevState: any) => ({ ...prevState, ...msg }));
          };

          const stream = await auth.openStream(
            `/api/board/game/stream/${gameId}`,
            {},
            handleStreamMessage
          );
          streamRef.current = {
            closePromise: stream.closePromise.then(() => undefined),
              close: stream.close,
          };
          console.log('Stream opened:', streamRef.current);

          streamRef.current.closePromise.catch((error) => {
            if (isMounted) {
              setStreamError(`Stream closed unexpectedly: ${error.message}`);
            }
          });
        } catch (error:any) {
          console.error('Error opening stream:', error);
          if (isMounted) {
            setStreamError(`Failed to open stream: ${error.message}`);
          }
        }
      }
    };

    openStreamConnection();

    return () => {
      isMounted = false;
      if (streamRef.current) {
        streamRef.current.close();
        console.log('Stream closed');
      }
    };
  }, [gameId, auth]);
  const renderStreamError = () => {
    if (!streamError) return null;
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{streamError}</Text>
      </View>
    );
  };


  const renderGameState = () => {
    if (!gameState) return null;
    return (
      <View style={styles.gameInfo}>
        <Text style={styles.gameStateText}>Game State:</Text>
        <Text>{JSON.stringify(gameState, null, 2)}</Text>
      </View>
    );
  };


  const createAiChallenge = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://lichess.org/api/challenge/ai', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `level=${encodeURIComponent(aiLevel)}&clock.limit=${encodeURIComponent('300')}&clock.increment=${encodeURIComponent('3')}&color=${encodeURIComponent('white')}`
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
  const chessboardRef = useRef<ChessboardRef>(null);
  
  if (playInWebView && gameId && auth) {
    return (
      <View style={{ flex: 1 }}>
        <Chessboard
            ref={chessboardRef}
            durations={{ move: 1000 }}
            onMove={async (state) => {
                if (state.move.color === 'w') {
                    const res = await auth?.fetchBody(`/api/board/game/${gameId}/move/${state.move.from}${state.move.to}`, { method: 'post' });
                    console.log("response", res);
                }
            }}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
   {renderGameState()}
   {renderStreamError()}
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
    backgroundColor: '#344e41',
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
  gameStateText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
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
  errorContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#ffebee',
    borderRadius: 8,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
  },
});