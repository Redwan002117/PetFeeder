export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      devices: {
        Row: {
          id: string
          name: string
          mac_address: string
          status: string
          model?: string | null
          firmware_version?: string | null
          food_level?: number | null
          battery_level?: number | null
          wifi_strength?: number | null
          last_seen?: string | null
          owner_id?: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          mac_address: string
          status?: string
          model?: string | null
          firmware_version?: string | null
          food_level?: number | null
          battery_level?: number | null
          wifi_strength?: number | null
          last_seen?: string | null
          owner_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          mac_address?: string
          status?: string
          model?: string | null
          firmware_version?: string | null
          food_level?: number | null
          battery_level?: number | null
          wifi_strength?: number | null
          last_seen?: string | null
          owner_id?: string | null
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          username: string
          full_name: string
          avatar_url?: string | null
          is_admin: boolean
          email_verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          full_name: string
          avatar_url?: string | null
          is_admin?: boolean
          email_verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          username?: string
          full_name?: string
          avatar_url?: string | null
          is_admin?: boolean
          email_verified?: boolean
          updated_at?: string
        }
      }
      // Add other tables as needed
    }
  }
}
