import { createSyncedStore } from './local';
import { DEFAULT_SETTINGS, DEFAULT_STATE, SETTINGS_KEY, STATE_KEY, type Settings, type TrackedState } from './schema';

export const settingsStore = createSyncedStore<Settings>(SETTINGS_KEY, DEFAULT_SETTINGS);
export const stateStore = createSyncedStore<TrackedState>(STATE_KEY, DEFAULT_STATE);
