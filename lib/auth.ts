export const SUPERADMIN_EMAIL = 'isaacrosanzala@gmail.com';

export const SUPERADMIN_PHONE = '+17147244249';

// Emails pre-approved for admin access without an invite code.
export const PRE_APPROVED_ADMIN_EMAILS = [
  'aaronw@jkrwd.com',
];

export function isSuperadminEmail(email?: string | null): boolean {
  if (!email) return false;
  return email.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase();
}

export function isPreApprovedAdmin(email?: string | null): boolean {
  if (!email) return false;
  const e = email.toLowerCase();
  return PRE_APPROVED_ADMIN_EMAILS.some((x) => x.toLowerCase() === e);
}
