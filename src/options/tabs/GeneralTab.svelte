<script lang="ts">
  import { t, setLocale, SUPPORTED_LOCALES, type Locale } from '../../lib/i18n';
  import { settingsStore } from '../../lib/storage/stores';
  import type { PopupLayout, Theme } from '../../lib/storage/schema';
  import { POPUP_LAYOUT_ORDER, POPUP_LAYOUT_NAME_KEYS } from '../../popup/layouts';
  import FieldRow from '../components/FieldRow.svelte';
  import Toggle from '../components/Toggle.svelte';

  const LOCALE_NAMES: Record<Locale, string> = { en: 'English', 'pt-BR': 'Português (BR)', es: 'Español' };
  const THEMES: Theme[] = ['system', 'light', 'dark'];

  function updateSetting<K extends keyof typeof $settingsStore>(key: K, value: (typeof $settingsStore)[K]) {
    settingsStore.update((current) => ({ ...current, [key]: value }));
  }

  function handleLocaleChange(event: Event) {
    setLocale((event.currentTarget as HTMLSelectElement).value as Locale);
  }

  function handleThemeChange(event: Event) {
    updateSetting('theme', (event.currentTarget as HTMLSelectElement).value as Theme);
  }

  function themeName(theme: Theme): string {
    if (theme === 'light') return $t('options.themeLight');
    if (theme === 'dark') return $t('options.themeDark');
    return $t('options.themeSystem');
  }

  function handlePopupLayoutChange(event: Event) {
    updateSetting('popupLayout', (event.currentTarget as HTMLSelectElement).value as PopupLayout);
  }
</script>

<h1>{$t('options.tabGeneral')}</h1>

<FieldRow label={$t('options.languageLabel')} hint={$t('options.languageHint')}>
  <select value={$settingsStore.locale} on:change={handleLocaleChange}>
    {#each SUPPORTED_LOCALES as code}
      <option value={code}>{LOCALE_NAMES[code]}</option>
    {/each}
  </select>
</FieldRow>

<FieldRow label={$t('options.themeLabel')} hint={$t('options.themeHint')}>
  <select value={$settingsStore.theme} on:change={handleThemeChange}>
    {#each THEMES as theme}
      <option value={theme}>{themeName(theme)}</option>
    {/each}
  </select>
</FieldRow>

<FieldRow label={$t('options.popupLayoutLabel')} hint={$t('options.popupLayoutHint')}>
  <select value={$settingsStore.popupLayout} on:change={handlePopupLayoutChange}>
    {#each POPUP_LAYOUT_ORDER as layout}
      <option value={layout}>{$t(POPUP_LAYOUT_NAME_KEYS[layout])}</option>
    {/each}
  </select>
</FieldRow>

<FieldRow label={$t('common.appName')} hint={$t('popup.disabledMessage')}>
  <Toggle checked={$settingsStore.extensionEnabled} onChange={(value) => updateSetting('extensionEnabled', value)} />
</FieldRow>

<FieldRow label={$t('options.pollingIntervalLabel')} hint={$t('options.pollingIntervalHint')}>
  <input
    type="number"
    min="1"
    max="60"
    value={$settingsStore.pollingIntervalMinutes}
    on:change={(event) => updateSetting('pollingIntervalMinutes', Number(event.currentTarget.value))}
  />
  <span class="unit">{$t('common.minutes')}</span>
</FieldRow>

<FieldRow label={$t('options.dailyRequiredWorkLabel')} hint={$t('options.dailyRequiredWorkHint')}>
  <input
    type="number"
    min="1"
    max="24"
    step="0.5"
    value={$settingsStore.dailyRequiredWorkMinutes / 60}
    on:change={(event) => updateSetting('dailyRequiredWorkMinutes', Math.round(Number(event.currentTarget.value) * 60))}
  />
  <span class="unit">{$t('common.hours')}</span>
</FieldRow>

<FieldRow label={$t('options.breakDurationLabel')} hint={$t('options.breakDurationHint')}>
  <input
    type="number"
    min="1"
    max="240"
    value={$settingsStore.breakDurationMinutes}
    on:change={(event) => updateSetting('breakDurationMinutes', Number(event.currentTarget.value))}
  />
  <span class="unit">{$t('common.minutes')}</span>
</FieldRow>

<style>
  h1 {
    font-size: 20px;
    margin: 0 0 8px;
  }

  select,
  input[type='number'] {
    font-family: inherit;
    font-size: 14px;
    padding: 6px 10px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-surface-raised);
    color: var(--color-ink);
  }

  input[type='number'] {
    width: 72px;
  }

  .unit {
    font-size: 12px;
    color: var(--color-text-muted);
  }
</style>
