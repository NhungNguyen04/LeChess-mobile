import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, StackNavigationProp } from '@react-navigation/stack';
import { View, Button, StyleSheet, TouchableOpacity, Text } from 'react-native';
import GameAI from '../screens/playAI'
import FriendGame from '../screens/playFriend';

type HomeScreenNavigationProp = StackNavigationProp<any, 'Home'>;

const Stack = createStackNavigator();

function Home({ navigation }: { navigation: HomeScreenNavigationProp }) {
    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.button} onPress={() => {navigation.navigate('AI')}}>
                <Text style={styles.buttonText}>Play with AI</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => {navigation.navigate('Friend') }}>
                <Text style={styles.buttonText}>Play with Friend</Text>
            </TouchableOpacity>
        </View>
    );
}

export default function App() {
    return (
            <Stack.Navigator initialRouteName="Home">
                <Stack.Screen name="Home" component={Home} />
                <Stack.Screen name="AI" component={GameAI} />
                <Stack.Screen name="Friend" component={FriendGame} />
            </Stack.Navigator>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    button: {
        margin: 10,
        backgroundColor: "#344e41",
        padding: 6,
        borderRadius: 10,
        width: '50%',
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        padding: 10,
        textAlign: 'center',
    },
});


