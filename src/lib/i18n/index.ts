import { derived } from 'svelte/store';
import { settingsStore } from '../storage/stores';
import { en } from './en';
import { ptBR } from './pt-BR';
import { es } from './es';
import { SUPPORTED_LOCALES, type Dictionary, type Locale } from './types';

export const dictionaries: Record<Locale, Dictionary> = {
  en,
  'pt-BR': ptBR,
  es,
};

function resolve(dictionary: Dictionary, path: string): string {
  const parts = path.split('.');
  let node: unknown = dictionary;
  for (const part of parts) {
    if (typeof node !== 'object' || node === null) return path;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === 'string' ? node : path;
}

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => String(vars[key] ?? ''));
}

export type Translate = (path: string, vars?: Record<string, string | number>) => string;

/** Pure translation, given an explicit dictionary. Used outside Svelte's reactive context (e.g. the offscreen poll loop). */
export function translate(dictionary: Dictionary, path: string, vars?: Record<string, string | number>): string {
  return interpolate(resolve(dictionary, path), vars);
}

export function translatorFor(localeValue: Locale): Translate {
  const dictionary = dictionaries[localeValue] ?? en;
  return (path, vars) => translate(dictionary, path, vars);
}

/** Reactive current locale, sourced from the shared settings store. */
export const locale = derived(settingsStore, ($settings) => $settings.locale);

/**
 * Reactive translator. Use as `$t('popup.clockIn')` in Svelte components so
 * the whole UI re-renders when the locale changes.
 */
export const t = derived(settingsStore, ($settings): Translate => {
  const dictionary = dictionaries[$settings.locale] ?? en;
  return (path, vars) => interpolate(resolve(dictionary, path), vars);
});

export function setLocale(next: Locale): void {
  settingsStore.update((current) => ({ ...current, locale: next }));
}

/** Maps the browser's UI language to one of our supported locales, defaulting to English. */
export function detectDefaultLocale(): Locale {
  const browserLocale = chrome.i18n.getUILanguage().toLowerCase();
  if (browserLocale.startsWith('pt')) return 'pt-BR';
  if (browserLocale.startsWith('es')) return 'es';
  return 'en';
}

export { SUPPORTED_LOCALES };
export type { Locale };
