import { getDatabase } from '../../../db/client';
import { enqueueOperation } from '../../sync/infrastructure/sync-repository';

/** Notificação da central (Tela 14), como o servidor a envia pelo sync. */
export type FeedItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  data?: { taskId?: string; streak?: number } | null;
  readAt?: string | null;
  createdAt: string;
};

async function readAll(): Promise<FeedItem[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<{ payload: string }>('SELECT payload FROM local_notifications');
  return rows.map((row) => JSON.parse(row.payload) as FeedItem)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function listFeed() {
  return readAll();
}

export async function unreadCount() {
  return (await readAll()).filter((item) => !item.readAt).length;
}

async function saveLocal(item: FeedItem) {
  const database = await getDatabase();
  await database.runAsync('UPDATE local_notifications SET payload = ? WHERE id = ?', JSON.stringify(item), item.id);
}

/** Marca como lida no aparelho na hora; o servidor recebe pela fila. */
export async function markRead(item: FeedItem) {
  if (item.readAt) return;
  await saveLocal({ ...item, readAt: new Date().toISOString() });
  await enqueueOperation('notification.read', { read: true }, { resourceId: item.id });
}

/** "Marcar todas": uma operação só, que o servidor aplica a todas as não lidas. */
export async function markAllRead() {
  const unread = (await readAll()).filter((item) => !item.readAt);
  if (!unread.length) return 0;
  const readAt = new Date().toISOString();
  for (const item of unread) await saveLocal({ ...item, readAt });
  await enqueueOperation('notification.read_all', {});
  return unread.length;
}
