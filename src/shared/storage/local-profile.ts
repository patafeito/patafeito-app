import { getDatabase } from '../../db/client';

export const localProfile = {
  async get(key: string) {
    const database = await getDatabase();
    const row = await database.getFirstAsync<{ value: string }>('SELECT value FROM local_profile WHERE key = ?', key);
    return row?.value;
  },
  async set(key: string, value: string) {
    const database = await getDatabase();
    await database.runAsync('INSERT INTO local_profile (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', key, value);
  },
};
