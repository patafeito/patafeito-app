import { getDatabase } from '../../../db/client';
import { authorizedFetch } from '../../../shared/network/authorized-fetch';
import { authSession, type Tokens } from '../../../shared/network/auth-session';
import { saveStoredUser } from '../../auth/infrastructure/auth-api';
import type { User } from '../../auth/domain/session';
import { synchronize } from '../../sync/application/sync-engine';
import { pendingOperationCount } from '../../sync/infrastructure/sync-repository';

/** Busca a conta no servidor (traz o @usuário a quem entrou antes da fase social). */
export async function refreshProfile() {
  const user = await authorizedFetch<User>('/me');
  await saveStoredUser(user);
  return user;
}

export async function updateProfile(input: { displayName?: string; email?: string; handle?: string; currentPassword?: string }) {
  const user = await authorizedFetch<User>('/me', { method: 'PATCH', body: JSON.stringify(input) });
  await saveStoredUser(user);
  return user;
}

/** O servidor encerra as outras sessões e devolve tokens novos para este aparelho. */
export async function changePassword(input: { currentPassword: string; newPassword: string }) {
  const { tokens } = await authorizedFetch<{ tokens: Tokens }>('/me/password', { method: 'POST', body: JSON.stringify(input) });
  await authSession.start(tokens);
}

export class PendingChangesError extends Error {
  constructor() { super('Ainda há alterações deste aparelho esperando sincronização. Conecte-se e tente de novo.'); }
}

/**
 * Zera o progresso no servidor e baixa tudo de novo. Antes, envia o que estiver na fila:
 * apagar a cópia local com operações pendentes perderia trabalho do usuário.
 */
export async function resetProgress(currentPassword: string) {
  await synchronize();
  if (await pendingOperationCount()) throw new PendingChangesError();
  await authorizedFetch('/me/reset-progress', { method: 'POST', body: JSON.stringify({ currentPassword }) });
  const database = await getDatabase();
  await database.execAsync(`
    DELETE FROM local_tasks;
    DELETE FROM local_pets;
    DELETE FROM local_inventory;
    DELETE FROM local_notifications;
    DELETE FROM local_focus_sessions;
    DELETE FROM sync_queue;
    DELETE FROM sync_state;
    DELETE FROM local_profile WHERE key IN ('rewards.balance', 'focus.breakEndsAt', 'shop.boosts');
  `);
  await synchronize();
}

/**
 * HU09 / RNF13: exclui a conta e todos os dados no servidor, de forma definitiva (LGPD).
 * Quem chama encerra a sessão depois, o que também apaga a cópia local.
 */
export async function deleteAccount(currentPassword: string) {
  await authorizedFetch('/me', { method: 'DELETE', body: JSON.stringify({ currentPassword }) });
}
