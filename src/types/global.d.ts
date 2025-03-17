// Global type definitions for the PetFeeder application

// Common device-related types
interface Device {
  id: string;
  name: string;
  mac_address: string;
  status: string;
  model?: string;
  firmware_version?: string;
  food_level?: number;
  battery_level?: number;
  wifi_strength?: number;
  last_seen?: string;
  owner_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface DeviceSettings {
  device_id: string;
  default_feed_amount: number;
  min_feed_amount: number;
  max_feed_amount: number;
  notification_level: number;
  notification_enabled: boolean;
  schedule_enabled: boolean;
  created_at?: string;
  updated_at?: string;
}

interface FeedingSchedule {
  id: string;
  device_id: string;
  time: string;
  days: boolean[];
  amount: number;
  enabled: boolean;
  created_at?: string;
  updated_at?: string;
}

interface FeedingEvent {
  id: string;
  device_id: string;
  amount: number;
  type: string;
  timestamp: string;
  created_at?: string;
}

interface FeedCommand {
  id: string;
  device_id: string;
  user_id: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at?: string;
  updated_at?: string;
}

interface Pet {
  id: string;
  name: string;
  owner_id: string;
  device_id?: string;
  breed?: string;
  weight?: number;
  age?: number;
  photo_url?: string;
  created_at?: string;
  updated_at?: string;
}

// User-related types
interface UserProfile {
  id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
  is_admin: boolean;
  email_verified: boolean;
  created_at?: string;
  updated_at?: string;
}

interface UserPermissions {
  canFeed: boolean;
  canSchedule: boolean;
  canViewStats: boolean;
}

interface UserPreferences {
  id: string;
  theme: 'light' | 'dark' | 'system';
  notifications_enabled: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  created_at?: string;
  updated_at?: string;
}

// Common state types
interface FormState {
  loading: boolean;
  error: string | null;
  success: boolean;
}
