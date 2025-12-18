import { useState } from 'react';
import { syncManager } from '../utils/sync';
import '../styles/SyncButton.css';

interface SyncButtonProps {
  isOnline: boolean;
  onSyncComplete?: () => void;
}

export default function SyncButton({ isOnline, onSyncComplete }: SyncButtonProps) {
  const [isSyncing, setSyncing] = useState(false);

  const handleSync = async () => {
    if (isSyncing || !isOnline) return;

    setSyncing(true);
    console.log('[SyncButton] Manual sync triggered');

    try {
      await syncManager.syncUnsyncedPosts();
      console.log('[SyncButton] Manual sync completed successfully');
    } catch (error) {
      console.error('[SyncButton] Manual sync failed:', error);
    } finally {
      setSyncing(false);
      onSyncComplete?.();
    }
  };

  return (
    <button
      onClick={handleSync}
      disabled={!isOnline || isSyncing}
      className="sync-button"
      title={isOnline ? (isSyncing ? 'Syncing...' : 'Manually sync unsynced posts') : 'Go online to sync'}
    >
      {isSyncing ? '⟳ Syncing...' : '⟳ Sync Now'}
    </button>
  );
}
