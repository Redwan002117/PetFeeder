export interface Profile {
  id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
  is_admin: boolean;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  id: string;
  notifications_enabled: boolean;
  email_notifications: boolean;
  theme: 'light' | 'dark' | 'system';
  created_at: string;
  updated_at: string;
}

export interface Device {
  id: string;
  owner_id: string;
  name: string;
  status: DeviceStatus;
  food_level: number;
  last_seen?: string;
  firmware_version?: string;
  created_at: string;
  updated_at: string;
}

export interface Pet {
  id: string;
  owner_id: string;
  device_id?: string;
  name: string;
  type: string;
  breed?: string;
  age?: number;
  weight?: number;
  photo_url?: string;
  feeding_amount?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface FeedingSchedule {
  id: string;
  pet_id: string;
  device_id: string;
  user_id: string;
  time_of_day: string;
  days_of_week: string[];
  amount: number;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface FeedingHistory {
  id: string;
  device_id: string;
  pet_id: string;
  user_id: string;
  amount: number;
  type: FeedingType;
  status: 'completed' | 'failed';
  schedule_id?: string;
  created_at: string;
}

export interface DeviceStats {
  id: string;
  device_id: string;
  total_feedings: number;
  total_amount: number;
  last_maintenance: string | null;
  created_at: string;
  updated_at: string;
}

export type DeviceStatus = 'online' | 'offline' | 'maintenance' | 'error';
export type FeedingType = 'manual' | 'scheduled' | 'error';
