import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AsyncStorage } from 'react-native';

// Import screens
import HomeScreen from './screens/HomeScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import FeedingScheduleScreen from './screens/FeedingScheduleScreen';

// Import local auth service
import { getCurrentUser, onAuthStateChanged } from './services/auth';

const Stack = createStackNavigator();

export default function App() {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      try {
        const userData = await AsyncStorage.getItem('currentUser');
        if (userData) {
          setUser(JSON.parse(userData));
        }
        setInitializing(false);
      } catch (error) {
        console.error('Error checking authentication state:', error);
        setInitializing(false);
      }
    };

    checkUser();

    // Set up auth state listener (simplified)
    const unsubscribe = onAuthStateChanged((user) => {
      setUser(user);
      if (user) {
        AsyncStorage.setItem('currentUser', JSON.stringify(user));
      } else {
        AsyncStorage.removeItem('currentUser');
      }
      
      if (initializing) {
        setInitializing(false);
      }
    });

    return unsubscribe;
  }, []);

  if (initializing) {
    return null; // Or a loading component
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {!user ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="FeedingSchedule" component={FeedingScheduleScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
