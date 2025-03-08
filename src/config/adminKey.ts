export const ADMIN_KEY = "@Fuckyou#hacker99.002117";

// Function to validate admin key
export function validateAdminKey(key: string): boolean {
  return key === ADMIN_KEY;
} 