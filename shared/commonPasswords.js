export const COMMON_PASSWORDS = new Set([
  'password',
  'password123',
  '12345678',
  '123456789',
  '1234567890',
  'qwertyuiop',
  'admin123',
  'welcome123',
  'craiova123',
  'craiova2026',
  'student123',
  'international',
  'iloveyou',
  'secret123',
  'changeme'
]);

export function isCommonPassword(password) {
  if (!password) return true;
  return COMMON_PASSWORDS.has(password.toLowerCase().trim());
}
