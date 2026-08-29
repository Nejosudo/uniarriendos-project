export function sanitizeText(input: string, maxLen: number): string {
  let s = input.trim().replace(/\s+/g, ' ');
  s = s.replace(/[<>]/g, '');
  if (s.length > maxLen) s = s.slice(0, maxLen);
  return s;
}

export function validateTelefonoCO(tel: string): string | null {
  const t = tel.trim().replace(/[\s-]/g, '');
  const normalized = t.startsWith('+57') ? t : t.startsWith('57') && t.length === 12 ? `+${t}` : t;
  const digits = normalized.replace(/^\+57/, '');
  if (!/^\d{10}$/.test(digits)) return 'Teléfono inválido. Usa 10 dígitos (ej: 3001234567) o +57 3001234567';
  return null;
}

export function normalizeTelefonoCO(tel: string): string {
  const t = tel.trim().replace(/[\s-]/g, '');
  if (t.startsWith('+57')) return t;
  if (t.startsWith('57') && t.length === 12) return `+${t}`;
  return `+57${t.replace(/^\+/, '')}`;
}

export function validatePassword(pw: string): string | null {
  if (pw.length < 8) return 'La contraseña debe tener al menos 8 caracteres';
  if (pw.length > 128) return 'Contraseña demasiado larga';
  return null;
}

export function validateNombre(nombre: string): string | null {
  const s = nombre.trim();
  if (s.length < 2) return 'El nombre debe tener al menos 2 caracteres';
  if (s.length > 60) return 'El nombre no puede superar 60 caracteres';
  if (!/^[\p{L}\s'.-]+$/u.test(s)) return 'Nombre contiene caracteres no permitidos';
  return null;
}

export function validateTextoLargo(texto: string, min: number, max: number, campo = 'Texto'): string | null {
  const s = texto.trim();
  if (s.length < min) return `${campo} debe tener al menos ${min} caracteres`;
  if (s.length > max) return `${campo} no puede superar ${max} caracteres`;
  return null;
}
