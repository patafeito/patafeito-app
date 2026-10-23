/** Validações do formulário de conta; o servidor repete as mesmas regras. */
export const PASSWORD_MIN_LENGTH = 8;

export function validateDisplayName(value: string) {
  const name = value.trim();
  if (name.length < 2) return 'O nome precisa de pelo menos 2 letras.';
  if (name.length > 80) return 'O nome pode ter no máximo 80 caracteres.';
  return undefined;
}

export function validateEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? undefined : 'Digite um e-mail válido.';
}

export function validateNewPassword(password: string, confirmation: string) {
  if (password.length < PASSWORD_MIN_LENGTH) return `A nova senha precisa de pelo menos ${PASSWORD_MIN_LENGTH} caracteres.`;
  if (password.length > 128) return 'A nova senha pode ter no máximo 128 caracteres.';
  if (password !== confirmation) return 'A confirmação não bate com a nova senha.';
  return undefined;
}
