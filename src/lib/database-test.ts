import { supabase } from './supabase';
import { tables } from './schema-version';

export interface DatabaseTestResult {
  success: boolean;
  connectionOk: boolean;
  authOk: boolean;
  tablesChecked: string[];
  missingTables: string[];
  error?: string;
  latency: number;
}

/**
 * Tests database connectivity and schema
 * @returns Test results with diagnostics information
 */
export async function testDatabaseConnection(): Promise<DatabaseTestResult> {
  const result: DatabaseTestResult = {
    success: false,
    connectionOk: false,
    authOk: false,
    tablesChecked: [],
    missingTables: [],
    latency: 0
  };
  
  const startTime = performance.now();
  
  try {
    // Test basic connection
    const { error: connectionError } = await supabase.from('_dummy_query').select('count');
    
    // Connection is ok even with query error as long as we got a response
    result.connectionOk = !connectionError || connectionError.code !== 'NETWORK_ERROR';
    
    // Test authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    result.authOk = !!session && !authError;
    
    // Check tables exist
    const tablesToCheck = [
      tables.profiles,
      tables.devices,
      tables.userPreferences,
      tables.feedingSchedules,
      tables.feedingHistory,
      tables.pets
    ];
    
    for (const table of tablesToCheck) {
      result.tablesChecked.push(table);
      try {
        const { error } = await supabase.from(table).select('count');
        if (error && error.code === '42P01') { // PostgreSQL undefined_table error
          result.missingTables.push(table);
        }
      } catch (err) {
        console.error(`Error checking table ${table}:`, err);
        result.missingTables.push(table);
      }
    }
    
    result.success = result.connectionOk && result.authOk && result.missingTables.length === 0;
    
  } catch (err) {
    console.error('Database test error:', err);
    result.error = err instanceof Error ? err.message : 'Unknown error during database test';
  } finally {
    result.latency = Math.round(performance.now() - startTime);
  }
  
  return result;
}

/**
 * Performs a write test to verify database permissions
 */
export async function testDatabaseWrite(userId: string): Promise<boolean> {
  try {
    // Create a temporary test entry and then delete it
    const testId = `test_${Date.now()}`;
    const { error: writeError } = await supabase
      .from('_test_entries')
      .insert([{ id: testId, user_id: userId, created_at: new Date().toISOString() }]);
      
    if (writeError) return false;
    
    // Clean up test entry
    await supabase.from('_test_entries').delete().eq('id', testId);
    return true;
  } catch (err) {
    console.error('Database write test failed:', err);
    return false;
  }
}
