/**
 * Database schema version information
 * This helps with tracking schema changes and compatibility
 */

export const SCHEMA_VERSION = '1.0.0';

export interface SchemaInfo {
  version: string;
  lastUpdated: string;
  compatibleAppVersions: string[];
}

export const schemaInfo: SchemaInfo = {
  version: SCHEMA_VERSION,
  lastUpdated: '2023-07-10',
  compatibleAppVersions: ['1.0.0', '1.0.1', '1.1.0']
};

/**
 * Checks if the current app version is compatible with the database schema
 * @param appVersion Current application version
 * @returns Boolean indicating compatibility
 */
export function isCompatibleWithSchema(appVersion: string): boolean {
  return schemaInfo.compatibleAppVersions.includes(appVersion);
}

/**
 * Database tables information
 */
export const tables = {
  profiles: 'profiles',
  devices: 'devices',
  userPreferences: 'user_preferences',
  feedingSchedules: 'feeding_schedules',
  feedingHistory: 'feeding_history',
  deviceStats: 'device_stats',
  feedCommands: 'feed_commands',
  pets: 'pets'
};

/**
 * Get database info for troubleshooting
 */
export async function getDatabaseInfo() {
  const info = {
    tables: {},
    version: SCHEMA_VERSION,
    status: 'unknown'
  };
  
  // In a real implementation, this would query the database
  // for actual table information and status
  
  return info;
}
