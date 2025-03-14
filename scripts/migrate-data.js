import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const firebaseConfig = {
  // Add your Firebase config here
};

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function migrateUsers() {
  const firebaseApp = initializeApp(firebaseConfig);
  const firestore = getFirestore(firebaseApp);
  
  const users = await getDocs(collection(firestore, 'users'));
  
  for (const user of users.docs) {
    const userData = user.data();
    
    // Transform Firebase data to Supabase format
    const supabaseUser = {
      id: user.id,
      email: userData.email,
      role: userData.role || 'user',
      username: userData.username,
      name: userData.name,
      email_verified: userData.emailVerified || false,
      device_id: userData.deviceId,
      permissions: userData.permissions || {
        canFeed: true,
        canSchedule: true,
        canViewStats: true
      }
    };
    
    // Insert into Supabase
    const { error } = await supabase
      .from('users')
      .upsert(supabaseUser);
      
    if (error) {
      console.error(`Error migrating user ${user.id}:`, error);
    } else {
      console.log(`Migrated user ${user.id}`);
    }
  }
}

async function migrateDevices() {
  const firebaseApp = initializeApp(firebaseConfig);
  const firestore = getFirestore(firebaseApp);
  
  const devices = await getDocs(collection(firestore, 'devices'));
  
  for (const device of devices.docs) {
    const deviceData = device.data();
    
    const supabaseDevice = {
      id: device.id,
      device_id: deviceData.deviceId,
      owner_id: deviceData.ownerId,
      name: deviceData.name,
      status: deviceData.status || 'offline',
      last_feeding: deviceData.lastFeeding?.toDate(),
      next_feeding: deviceData.nextFeeding?.toDate()
    };
    
    const { error } = await supabase
      .from('devices')
      .upsert(supabaseDevice);
      
    if (error) {
      console.error(`Error migrating device ${device.id}:`, error);
    } else {
      console.log(`Migrated device ${device.id}`);
    }
  }
}

async function main() {
  try {
    console.log('Starting migration...');
    await migrateUsers();
    await migrateDevices();
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main();