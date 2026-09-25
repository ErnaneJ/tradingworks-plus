import { writable, type Writable } from 'svelte/store';

/**
 * Thin wrapper around chrome.storage.local. Kept generic and dependency-free
 * so it can be shared by the i18n store, the settings store, and the
 * background/offscreen contexts alike.
 */

/**
 * Reads `key`, shallow-merged onto `fallback`. The merge (rather than a plain `??`) keeps
 * older persisted values from before a field was added to the schema (Settings/TrackedState)
 * from resolving to `undefined` at every new field, instead of the field's own default.
 */
export async function getFromStorage<T>(key: string, fallback: T): Promise<T> {
  const result = await chrome.storage.local.get(key);
  const stored = result[key] as Partial<T> | undefined;
  return stored ? { ...fallback, ...stored } : fallback;
}

export async function setInStorage<T>(key: string, value: T): Promise<void> {
  await chrome.storage.local.set({ [key]: value });
}

export function watchStorage<T>(key: string, callback: (value: T) => void): () => void {
  const listener = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
    if (areaName !== 'local') return;
    const change = changes[key];
    if (change === undefined) return;
    callback(change.newValue as T);
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}

/**
 * A writable Svelte store backed by chrome.storage.local under `key`.
 * Reads the persisted value asynchronously on creation, then stays in sync
 * across every extension context (popup, options, offscreen) via
 * chrome.storage.onChanged.
 */
export function createSyncedStore<T>(key: string, fallback: T): Writable<T> {
  const store = writable<T>(fallback);

  void getFromStorage(key, fallback).then((value) => store.set(value));
  // Merge here too: a write from an older schema shape (e.g. a stale cached
  // background script during a reload) would otherwise push an object missing
  // newer fields straight into every live store via chrome.storage.onChanged.
  watchStorage<T>(key, (value) => store.set(value ? { ...fallback, ...value } : fallback));

  return {
    subscribe: store.subscribe,
    set(value: T) {
      store.set(value);
      void setInStorage(key, value);
    },
    update(updater) {
      store.update((current) => {
        const next = updater(current);
        void setInStorage(key, next);
        return next;
      });
    },
  };
}
