export type SyncOperationType = 'task.create' | 'task.update' | 'task.delete' | 'task.complete' | 'task.reopen' | 'notification.read' | 'inventory.equip' | 'focus.complete' | 'pet.feed' | 'pet.interact' | 'notification.read_all';
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
