/**
 * Type definitions for device-related interfaces
 */

interface DeviceStatus {
  online: boolean;
  lastSeen?: string;
  batteryLevel?: number;
  firmwareVersion?: string;
  wifiName?: string;
  ipAddress?: string;
  signalStrength?: number;
  [key: string]: any;
}

interface DeviceData {
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

interface FeedingEvent {
  id: string;
  device_id: string;
  timestamp: string;
  amount: number;
  type: 'manual' | 'scheduled';
}

interface FeedingStats {
  totalFeedings: number;
  totalAmount: number;
  feedingsToday: number;
  averageAmount: number;
}
