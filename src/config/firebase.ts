// Re-export Firebase configuration from the main Firebase file
import { database, auth, storage, app } from '@/lib/firebase';

// Export as db for compatibility with admin components
export const db = database;

export { auth, storage, app };

// Export default for compatibility with existing imports
export default { db, auth, storage, app }; 