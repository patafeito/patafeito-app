import * as SQLite from 'expo-sqlite';

let databasePromise: Promise<SQLite.SQLiteDatabase> | undefined;

export async function getDatabase() {
  databasePromise ??= SQLite.openDatabaseAsync('patafeito.db').then(async (database) => {
    await database.execAsync(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;
      CREATE TABLE IF NOT EXISTS local_tasks (
        id TEXT PRIMARY KEY NOT NULL, title TEXT NOT NULL, description TEXT,
        difficulty TEXT NOT NULL, status TEXT NOT NULL, due_at TEXT,
        completed_at TEXT, version INTEGER NOT NULL, updated_at TEXT NOT NULL,
        deleted_at TEXT, sync_state TEXT NOT NULL DEFAULT 'synced'
      );
      CREATE TABLE IF NOT EXISTS local_pets (
        id TEXT PRIMARY KEY NOT NULL, payload TEXT NOT NULL, version INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS local_inventory (
        id TEXT PRIMARY KEY NOT NULL, payload TEXT NOT NULL, version TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS local_notifications (
        id TEXT PRIMARY KEY NOT NULL, payload TEXT NOT NULL, version TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS sync_queue (
        op_id TEXT PRIMARY KEY NOT NULL, operation_type TEXT NOT NULL,
        resource_id TEXT, base_version INTEGER, payload TEXT NOT NULL,
        state TEXT NOT NULL DEFAULT 'pending', attempts INTEGER NOT NULL DEFAULT 0,
        next_attempt_at INTEGER NOT NULL DEFAULT 0, conflict_data TEXT,
        created_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS sync_queue_pending_idx ON sync_queue(state, next_attempt_at, created_at);
      CREATE TABLE IF NOT EXISTS sync_state (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);
    `);
    return database;
  });
  return databasePromise;
}
