export const SUPERADMIN_EMAIL = 'isaacrosanzala@gmail.com';

export const SUPERADMIN_PHONE = '+17147244249';

export function isSuperadminEmail(email?: string | null): boolean {
  if (!email) return false;
  return email.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase();
}
