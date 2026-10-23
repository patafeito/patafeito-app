import type * as SQLite from 'expo-sqlite';

const migrations = [
  `CREATE TABLE IF NOT EXISTS local_tasks (
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
   CREATE TABLE IF NOT EXISTS sync_state (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);`,

  `ALTER TABLE local_tasks ADD COLUMN pending_xp INTEGER;
   ALTER TABLE local_tasks ADD COLUMN pending_coins INTEGER;
   CREATE TABLE IF NOT EXISTS local_focus_sessions (
     id TEXT PRIMARY KEY NOT NULL, task_id TEXT, started_at TEXT NOT NULL,
     duration_seconds INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'active',
     finished_at TEXT, paused_at TEXT, sync_state TEXT NOT NULL DEFAULT 'local'
   );
   CREATE INDEX IF NOT EXISTS local_focus_sessions_status_idx ON local_focus_sessions(status, started_at);
   CREATE TABLE IF NOT EXISTS local_profile (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);`,

  `ALTER TABLE local_tasks ADD COLUMN recurrence TEXT;
   ALTER TABLE local_tasks ADD COLUMN recurrence_day INTEGER;
   ALTER TABLE local_tasks ADD COLUMN series_id TEXT;
   CREATE INDEX IF NOT EXISTS local_tasks_series_idx ON local_tasks(series_id, due_at);`,
];

export async function migrate(database: SQLite.SQLiteDatabase) {
  const row = await database.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const current = row?.user_version ?? 0;
  for (let version = current; version < migrations.length; version += 1) {
    await database.execAsync(migrations[version]);
    await database.execAsync(`PRAGMA user_version = ${version + 1}`);
  }
}

export const latestSchemaVersion = migrations.length;
