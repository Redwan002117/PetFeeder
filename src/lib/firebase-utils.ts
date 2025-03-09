import { ref, set, update, get, onValue, off, push, remove, serverTimestamp } from 'firebase/database';
import { database, initializeFirebase } from './firebase';

// Safe database reference function
export const safeRef = (path: string) => {
  try {
    // Try to initialize Firebase if not already initialized
    if (!database) {
      console.error('Database not initialized. Attempting to initialize Firebase...');
      initializeFirebase();
      
      // If database is still not available after initialization, return null
      if (!database) {
        console.error('Failed to initialize database. Database features will not work.');
        return null;
      }
    }
    
    // Use the database's ref method
    return database.ref(path);
  } catch (error) {
    console.error(`Error creating reference to ${path}:`, error);
    return null;
  }
};

// Safe database operations with fallback values
export const safeSet = async (path: string, data: any): Promise<boolean> => {
  const reference = safeRef(path);
  if (!reference) {
    console.error(`Cannot set data at ${path}: Database reference is null`);
    return false;
  }
  
  try {
    // Check if we're using a mock reference
    if (database._mockData !== undefined) {
      // Store data in the mock database
      const pathParts = reference.path.split('/');
      let current = database._mockData;
      
      // Create nested objects for the path
      for (let i = 0; i < pathParts.length - 1; i++) {
        const part = pathParts[i];
        if (!part) continue;
        
        if (!current[part]) {
          current[part] = {};
        }
        current = current[part];
      }
      
      // Set the data at the final path
      const lastPart = pathParts[pathParts.length - 1];
      if (lastPart) {
        current[lastPart] = { ...data, _timestamp: Date.now() };
      }
      
      // Trigger any listeners for this path
      if (database._listeners && database._listeners[reference.path]) {
        database._listeners[reference.path].forEach((callback: Function) => {
          callback({
            val: () => data,
            exists: () => true,
            key: reference.key
          });
        });
      }
      
      return true;
    }
    
    // Use the real Firebase set function
    await set(reference, data);
    return true;
  } catch (error) {
    console.error(`Error setting data at ${path}:`, error);
    return false;
  }
};

export const safeUpdate = async (path: string, data: any): Promise<boolean> => {
  const reference = safeRef(path);
  if (!reference) {
    console.error(`Cannot update data at ${path}: Database reference is null`);
    return false;
  }
  
  try {
    // Check if we're using a mock reference
    if (database._mockData !== undefined) {
      // Get current data
      const currentData = await safeGet(path) || {};
      
      // Update with new data
      return safeSet(path, { ...currentData, ...data });
    }
    
    // Use the real Firebase update function
    await update(reference, data);
    return true;
  } catch (error) {
    console.error(`Error updating data at ${path}:`, error);
    return false;
  }
};

export const safeGet = async (path: string): Promise<any> => {
  const reference = safeRef(path);
  if (!reference) {
    console.error(`Cannot get data from ${path}: Database reference is null`);
    return null;
  }
  
  try {
    // Check if we're using a mock reference
    if (database._mockData !== undefined) {
      // Get data from the mock database
      const pathParts = reference.path.split('/');
      let current = database._mockData;
      
      // Navigate through the path
      for (const part of pathParts) {
        if (!part) continue;
        
        if (!current[part]) {
          // Path doesn't exist in mock data
          return null;
        }
        current = current[part];
      }
      
      return current;
    }
    
    // Use the real Firebase get function
    const snapshot = await get(reference);
    return snapshot.exists() ? snapshot.val() : null;
  } catch (error) {
    console.error(`Error getting data from ${path}:`, error);
    return null;
  }
};

// Safe onValue function for listening to database changes
export const safeOnValue = (path: string, callback: Function, errorCallback?: Function) => {
  const reference = safeRef(path);
  if (!reference) {
    console.error(`Cannot listen to ${path}: Database reference is null`);
    if (errorCallback) {
      errorCallback(new Error(`Database reference is null for path: ${path}`));
    }
    return () => {}; // Return empty cleanup function
  }
  
  try {
    // Check if we're using a mock reference
    if (database._mockData !== undefined) {
      // Register the listener in the mock database
      if (!database._listeners) {
        database._listeners = {};
      }
      
      if (!database._listeners[reference.path]) {
        database._listeners[reference.path] = [];
      }
      
      database._listeners[reference.path].push(callback);
      
      // Get initial data
      safeGet(path).then(data => {
        callback({
          val: () => data,
          exists: () => data !== null,
          key: reference.key
        });
      });
      
      // Return cleanup function
      return () => {
        if (database._listeners && database._listeners[reference.path]) {
          const index = database._listeners[reference.path].indexOf(callback);
          if (index !== -1) {
            database._listeners[reference.path].splice(index, 1);
          }
        }
      };
    }
    
    // Use the real Firebase onValue function
    const unsubscribe = onValue(reference, callback, errorCallback);
    return unsubscribe;
  } catch (error) {
    console.error(`Error setting up listener for ${path}:`, error);
    if (errorCallback) {
      errorCallback(error);
    }
    return () => {}; // Return empty cleanup function
  }
};

// Safe push function for generating unique IDs and pushing data
export const safePush = async (path: string, data: any): Promise<string | null> => {
  const reference = safeRef(path);
  if (!reference) {
    console.error(`Cannot push data to ${path}: Database reference is null`);
    return null;
  }
  
  try {
    // Check if we're using a mock reference
    if (database._mockData !== undefined) {
      // Generate a unique ID (similar to Firebase's push IDs)
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let uniqueId = '';
      for (let i = 0; i < 20; i++) {
        uniqueId += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      
      // Set the data with the unique ID
      const newPath = `${path}/${uniqueId}`;
      await safeSet(newPath, data);
      
      return uniqueId;
    }
    
    // Use the real Firebase push function
    const newRef = push(reference);
    await set(newRef, data);
    return newRef.key;
  } catch (error) {
    console.error(`Error pushing data to ${path}:`, error);
    return null;
  }
};

// Safe remove function for deleting data
export const safeRemove = async (path: string): Promise<boolean> => {
  const reference = safeRef(path);
  if (!reference) {
    console.error(`Cannot remove data at ${path}: Database reference is null`);
    return false;
  }
  
  try {
    // Check if we're using a mock reference
    if (database._mockData !== undefined) {
      // Remove data from the mock database
      const pathParts = reference.path.split('/');
      let current = database._mockData;
      
      // Navigate to the parent of the node to remove
      for (let i = 0; i < pathParts.length - 1; i++) {
        const part = pathParts[i];
        if (!part) continue;
        
        if (!current[part]) {
          // Path doesn't exist, nothing to remove
          return true;
        }
        current = current[part];
      }
      
      // Remove the node
      const lastPart = pathParts[pathParts.length - 1];
      if (lastPart && current[lastPart] !== undefined) {
        delete current[lastPart];
        
        // Trigger any listeners for this path
        if (database._listeners && database._listeners[reference.path]) {
          database._listeners[reference.path].forEach((callback: Function) => {
            callback({
              val: () => null,
              exists: () => false,
              key: reference.key
            });
          });
        }
      }
      
      return true;
    }
    
    // Use the real Firebase remove function
    await remove(reference);
    return true;
  } catch (error) {
    console.error(`Error removing data at ${path}:`, error);
    return false;
  }
};

// Safe serverTimestamp function
export const safeServerTimestamp = () => {
  // If using mock database, return current timestamp
  if (database && database._mockData !== undefined) {
    return Date.now();
  }
  
  // Use the real Firebase serverTimestamp
  return serverTimestamp();
}; 