import React, { useState } from 'react';
import { View, SafeAreaView, StyleSheet, TextInput, Button, Alert } from 'react-native';
import AuthButton from './authButton';
import { Auth, Me } from '../src/auth';
import { Redirect, useRouter } from 'expo-router';


const auth = new Auth();

export default function AuthScreen() {
    const [user, setUser] = useState<Me | null>(null);
  const [token, setToken] = useState('');
  const router = useRouter();


  const handleManualTokenEntry = async () => {
    try {
      await auth.manualLogin(token);
      setUser(auth.me || null); // Update the user state if login succeeds
      if (auth.me) {
        router.replace('/(tabs)'); // Redirect to the main app screen
      }
    } catch (error) {
      Alert.alert('Error', 'Invalid token.');
    }
  };

  if (user) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <AuthButton />
      <View style={styles.manualTokenContainer}>
        <TextInput
          style={styles.input}
          placeholder="Enter token"
          value={token}
          onChangeText={setToken}
        />
        <Button title="Submit Token" onPress={handleManualTokenEntry} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  manualTokenContainer: {
    marginTop: 20,
    width: '80%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#344e41',
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
  },
});