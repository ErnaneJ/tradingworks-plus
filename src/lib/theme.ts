import { settingsStore } from './storage/stores';

/** Applies `settings.theme` to `<html data-theme>` so tokens.css picks the right palette. Call once per page. */
export function initThemeSync(): () => void {
  return settingsStore.subscribe((settings) => {
    const root = document.documentElement;
    if (settings.theme === 'system') {
      delete root.dataset.theme;
    } else {
      root.dataset.theme = settings.theme;
    }
  });
}
