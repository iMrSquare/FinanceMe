export function validateUsername(username: string): string | null {
  if (!username) return 'El usuario es requerido';
  if (!/^[a-z0-9_]+$/.test(username)) return 'Solo se permiten minúsculas, números y guión bajo';
  if (username.length < 3) return 'Mínimo 3 caracteres';
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return 'La contraseña es requerida';
  if (password.length < 8) return 'Mínimo 8 caracteres';
  if (!/[a-z]/.test(password)) return 'Debe incluir al menos una minúscula';
  if (!/[A-Z]/.test(password)) return 'Debe incluir al menos una mayúscula';
  if (!/[0-9]/.test(password)) return 'Debe incluir al menos un número';
  if (!/[^a-zA-Z0-9]/.test(password)) return 'Debe incluir al menos un carácter especial (!@#$%...)';
  return null;
}
