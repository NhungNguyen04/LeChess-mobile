import React, { useEffect, useState } from 'react';
import { View, Text, Button, Alert } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { Auth, Me, auth } from '../src/auth'; // Import the Auth class, Me interface, and use the singleton instance
import {useAuth} from '../../hooks/useAuth';

export default function AuthButton() {
  // State to hold the user information
  const [user, setUser] = useState<Me | null>(null);
  const {isLoading} = useAuth();
  const router = useRouter();

  // Effect to initialize authentication on component mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        await auth.init(); // Initialize and check if user is authenticated
        setUser(auth.me || null); // Set the authenticated user, if any
      } catch (error) {
        Alert.alert("Error", "Error during authentication initialization");
        console.error("Error during authentication initialization:", error);
      }
    };

    initializeAuth();
  }, []);
  if (isLoading) {
    return (<Text>Loading...</Text>)
  }

  // Handle Login
  const handleLogin = async () => {
    try {
      await auth.login();
      setUser(auth.me || null); // Update the user state if login succeeds
      if (auth.me) {
        router.replace('/(tabs)'); // Redirect to the main app screen
      }
    } catch (error) {
      Alert.alert("Login failed", "Could not log in.");
      console.error("Login failed:", error);
    }
  };

  // Redirect to the main app screen if the user is already authenticated
  if (user) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <View style={{ alignItems: 'center', padding: 16 }}>
      <Button onPress={handleLogin} title="Login with Lichess" color="#344e41" />
    </View>
  );
}
