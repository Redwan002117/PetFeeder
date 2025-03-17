// This file is being replaced with Supabase configuration
import { supabase } from '@/lib/supabase';

// For compatibility with existing code
export const db = {
  // DB methods that might be needed for compatibility 
  ref: (path: string) => {
    console.warn('Firebase db.ref() was called. Please update to use Supabase instead.');
    return {
      set: async (data: any) => {
        console.warn(`Firebase db.ref("${path}").set() was called. Please update to use Supabase.`);
        return Promise.resolve();
      },
      update: async (data: any) => {
        console.warn(`Firebase db.ref("${path}").update() was called. Please update to use Supabase.`);
        return Promise.resolve();
      },
      remove: async () => {
        console.warn(`Firebase db.ref("${path}").remove() was called. Please update to use Supabase.`);
        return Promise.resolve();
      },
      on: (event: string, callback: Function) => {
        console.warn(`Firebase db.ref("${path}").on() was called. Please update to use Supabase.`);
        // No way to properly mock this
        return () => {}; // Return unsubscribe function
      }
    };
  }
};

export const auth = {
  currentUser: null,
  onAuthStateChanged: (callback: Function) => {
    console.warn('Firebase auth.onAuthStateChanged() was called. Please update to use Supabase.');
    
    // Return Supabase auth subscriber
    const { data } = supabase.auth.onAuthStateChange((_, session) => {
      callback(session?.user || null);
    });
    
    return data.subscription.unsubscribe;
  }
};

export const storage = {
  ref: (path: string) => {
    console.warn('Firebase storage.ref() was called. Please update to use Supabase storage.');
    return {
      put: async (file: File) => {
        console.warn(`Firebase storage.ref("${path}").put() was called. Please update to use Supabase.`);
        return Promise.resolve();
      },
      getDownloadURL: async () => {
        console.warn(`Firebase storage.ref("${path}").getDownloadURL() was called. Please update to use Supabase.`);
        return Promise.resolve("");
      }
    };
  }
};

// Mock app object for compatibility
export const app = {
  name: "PetFeeder-Supabase"
};

// Export default for compatibility with existing imports
export default { db, auth, storage, app };
