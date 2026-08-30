export const BLOCKED_WORDS = ['puta','puto','mierda','gonorrea','marica','pirobo','hp','malparido','estupido','imbecil'];
export const CONTACT_PATTERNS = [/\b3\d{9}\b/, /\+57\s?3\d{9}/, /\b[\w.-]+@[\w.-]+\.\w+\b/, /instagram\.com\/\w+/i, /facebook\.com\/\w+/i, /wa\.me\/\d+/i];
export function containsBlocked(text: string): string | null {
  const lower = text.toLowerCase();
  for (const w of BLOCKED_WORDS) if (lower.includes(w)) return w;
  return null;
}
export function containsContactInfo(text: string): boolean {
  return CONTACT_PATTERNS.some(r => r.test(text));
}
