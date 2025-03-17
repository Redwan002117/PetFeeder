// Replace Firebase with local storage service

// Instead of Firebase imports, use local utilities
import { AsyncStorage } from 'react-native';

// Local data service
export const saveData = async (collection, id, data) => {
  try {
    const key = `${collection}_${id}`;
    await AsyncStorage.setItem(key, JSON.stringify(data));
    return { id, ...data };
  } catch (error) {
    console.error('Error saving data:', error);
    throw error;
  }
};

export const getData = async (collection, id) => {
  try {
    const key = `${collection}_${id}`;
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting data:', error);
    throw error;
  }
};

export const getAllData = async (collection) => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const collectionKeys = keys.filter(key => key.startsWith(`${collection}_`));
    const results = await AsyncStorage.multiGet(collectionKeys);
    return results.map(([key, value]) => JSON.parse(value));
  } catch (error) {
    console.error('Error getting all data:', error);
    throw error;
  }
};

export const updateData = async (collection, id, data) => {
  try {
    const key = `${collection}_${id}`;
    const existingData = await AsyncStorage.getItem(key);
    const updatedData = { ...JSON.parse(existingData || '{}'), ...data };
    await AsyncStorage.setItem(key, JSON.stringify(updatedData));
    return updatedData;
  } catch (error) {
    console.error('Error updating data:', error);
    throw error;
  }
};

export const deleteData = async (collection, id) => {
  try {
    const key = `${collection}_${id}`;
    await AsyncStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('Error deleting data:', error);
    throw error;
  }
};
