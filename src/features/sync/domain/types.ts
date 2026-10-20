export type SyncOperationType = 'task.create' | 'task.update' | 'task.delete' | 'notification.read' | 'inventory.equip';
export type SyncQueueState = 'pending' | 'conflict' | 'rejected';
export type SyncResultStatus = 'applied' | 'duplicate' | 'conflict' | 'rejected';

export type QueuedOperation = {
  opId: string;
  type: SyncOperationType;
  resourceId?: string;
  baseVersion?: number;
  payload: Record<string, unknown>;
  attempts: number;
};

export type SyncChange = {
  entityType: 'task' | 'pet' | 'inventory' | 'notification';
  entityId: string;
  changeType: 'upsert' | 'delete';
  version: string;
  data: Record<string, unknown>;
};
