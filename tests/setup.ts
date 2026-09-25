/**
 * Minimal chrome.storage stub so modules that create chrome-storage-backed
 * stores at import time (e.g. src/lib/storage/stores.ts) don't throw in the
 * jsdom test environment, which has no `chrome` global.
 */
(globalThis as unknown as { chrome: unknown }).chrome = {
  storage: {
    local: {
      get: async () => ({}),
      set: async () => {},
    },
    onChanged: {
      addListener: () => {},
      removeListener: () => {},
    },
  },
};
