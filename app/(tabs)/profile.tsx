import React, { useState, useEffect } from 'react';  
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Image } from 'react-native';  
import { useAuth } from '../../hooks/useAuth';  
import { useRouter } from 'expo-router';  
import AuthButton from '../(auth)/authButton';  
import { Auth, Me } from '../src/auth';  

export default function ProfileScreen() {  
  const { user, logout, isLoading, isAuthenticated } = useAuth();  
  const [fetchedUser, setFetchedUser] = useState<Me | null>(null);  
  const router = useRouter();  

  useEffect(() => {  
    if (isAuthenticated && user) {  
      setFetchedUser(user);  
    }  
  }, [isAuthenticated, user]);  

  const handleLogout = async () => {  
    try {  
      await logout(); // Perform logout  
      router.push('/(auth)');  
    } catch (error) {  
      console.error('Logout failed:', error);  
      // You might want to show an error message to the user here  
    }  
  };  

  if (!isAuthenticated || !fetchedUser) {  
    return null; // or return a loading component  
  }  

  if (isLoading) {  
    return (  
      <SafeAreaView style={styles.container}>  
        <Text>Loading...</Text>  
      </SafeAreaView>  
    );  
  }  

  return (  
    <SafeAreaView style={styles.container}>  
      <View style={styles.profileContainer}>  
        <Image  
          source={{ uri: `https://lichess1.org/assets/images/placeholder.svg` }}  
          style={styles.profileImage}  
        />  
        <View>  
          <Text style={styles.username}>{fetchedUser.username}</Text>  
          <Text style={styles.userId}>ID: {fetchedUser.id}</Text>  
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>  
            <Text style={styles.logoutButtonText}>Log Out</Text>  
          </TouchableOpacity>  
        </View>  
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
  },
  profileContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  userId: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  logoutButton: {
    backgroundColor: '#e53e3e',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});