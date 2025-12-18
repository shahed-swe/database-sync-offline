/**
 * Global type declarations for Service Worker
 */

interface SyncEvent extends ExtendableEvent {
  tag: string;
  lastChance: boolean;
}

interface ExtendableMessageEvent extends ExtendableEvent {
  data: any;
  origin: string;
  lastEventId: string;
  source: Client | ServiceWorker | MessagePort | null;
  ports: ReadonlyArray<MessagePort>;
}

interface ServiceWorkerGlobalScope {
  __WB_MANIFEST: any;
}
