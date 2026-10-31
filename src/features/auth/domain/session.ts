/** `handle` é o @usuário público; contas de versões antigas do app só o recebem ao abrir o perfil. */
export type User = { id: string; email: string; displayName: string; handle?: string | null };
export type SessionStatus = 'loading' | 'signed-out' | 'signed-in';
