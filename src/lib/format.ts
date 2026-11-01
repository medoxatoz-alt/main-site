// Phone sign-ins are stored with a synthetic email such as
// "+918106508633@phone.auth.medox". These helpers keep that internal
// address out of the UI.

const PHONE_AUTH_RE = /^(\+?\d{8,15})@phone\.auth\./i;

export function isPhoneAuthEmail(email?: string | null): boolean {
  return !!email && PHONE_AUTH_RE.test(email);
}

/** "+918106508633" -> "+91 81065 08633" (other formats returned as-is). */
export function formatPhone(raw: string): string {
  const m = raw.match(/^\+?91(\d{5})(\d{5})$/);
  return m ? `+91 ${m[1]} ${m[2]}` : raw;
}

/** What to show under a user's name: their phone for phone sign-ins, else their email. */
export function displayContact(email?: string | null): string {
  if (!email) return '';
  const m = email.match(PHONE_AUTH_RE);
  return m ? formatPhone(m[1]) : email;
}
