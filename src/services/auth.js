import { AsyncStorage } from 'react-native';
import { v4 as uuidv4 } from 'uuid';

// Local authentication state
let currentUser = null;

export const signUp = async (email, password) => {
  try {
    const userId = uuidv4();
    const user = {
      uid: userId,
      email,
      createdAt: new Date().toISOString()
    };
    
    // Store user in local storage
    await AsyncStorage.setItem('users_' + userId, JSON.stringify(user));
    await AsyncStorage.setItem('auth_credentials_' + email, JSON.stringify({ userId, password }));
    
    currentUser = user;
    return user;
  } catch (error) {
    console.error('Error signing up:', error);
    throw error;
  }
};

export const signIn = async (email, password) => {
  try {
    const credentials = await AsyncStorage.getItem('auth_credentials_' + email);
    
    if (!credentials) {
      throw new Error('User not found');
    }
    
    const { userId, password: storedPassword } = JSON.parse(credentials);
    
    if (password !== storedPassword) {
      throw new Error('Invalid password');
    }
    
    const userData = await AsyncStorage.getItem('users_' + userId);
    currentUser = JSON.parse(userData);
    
    return currentUser;
  } catch (error) {
    console.error('Error signing in:', error);
    throw error;
  }
};

export const signOut = async () => {
  currentUser = null;
  return true;
};

export const getCurrentUser = () => {
  return currentUser;
};

export const onAuthStateChanged = (callback) => {
  callback(currentUser);
  // In a real app, you would set up a subscription here
  return () => {}; // Return unsubscribe function
};
