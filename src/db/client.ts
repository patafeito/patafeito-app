import * as SQLite from 'expo-sqlite';
import { migrate } from './migrations';

const databaseName = 'patafeito.db';
let databasePromise: Promise<SQLite.SQLiteDatabase> | undefined;

export async function getDatabase() {
  databasePromise ??= SQLite.openDatabaseAsync(databaseName).then(async (database) => {
    await database.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
    await migrate(database);
    return database;
  });
  return databasePromise;
}

export async function resetDatabase() {
  const database = await getDatabase();
  await database.execAsync(`
    DELETE FROM local_tasks;
    DELETE FROM local_pets;
    DELETE FROM local_inventory;
    DELETE FROM local_notifications;
    DELETE FROM local_focus_sessions;
    DELETE FROM local_profile;
    DELETE FROM sync_queue;
    DELETE FROM sync_state;
  `);
}
