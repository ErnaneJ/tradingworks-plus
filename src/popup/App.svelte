<script lang="ts">
  import { stateStore, settingsStore } from '../lib/storage/stores';
  import { t } from '../lib/i18n';
  import { formatRelativeTime } from '../lib/domain/time';
  import { initThemeSync } from '../lib/theme';
  import { POPUP_LAYOUT_WIDTHS, POPUP_LAYOUT_NAME_KEYS, nextPopupLayout } from './layouts';
  import StandardBody from './layouts/StandardBody.svelte';
  import CompactBody from './layouts/CompactBody.svelte';
  import MinimalBody from './layouts/MinimalBody.svelte';
  import StatsBody from './layouts/StatsBody.svelte';
  import TimelineBody from './layouts/TimelineBody.svelte';
  import FullBody from './layouts/FullBody.svelte';
  import ClassicBody from './layouts/ClassicBody.svelte';
  import EstimatedFinish from './components/EstimatedFinish.svelte';

  initThemeSync();

  const BODIES = {
    standard: StandardBody,
    compact: CompactBody,
    minimal: MinimalBody,
    stats: StatsBody,
    timeline: TimelineBody,
    full: FullBody,
    classic: ClassicBody,
  };

  let pending = false;
  let refreshing = false;
  let now = Date.now();
  setInterval(() => (now = Date.now()), 5000);

  async function handlePunch() {
    pending = true;
    try {
      await chrome.runtime.sendMessage({ type: 'request-punch' });
    } finally {
      pending = false;
    }
  }

  async function handleForceRefresh() {
    refreshing = true;
    try {
      await chrome.runtime.sendMessage({ type: 'request-refresh' });
    } finally {
      refreshing = false;
    }
  }

  function cycleLayout() {
    settingsStore.update((current) => ({ ...current, popupLayout: nextPopupLayout(current.popupLayout) }));
  }

  function openSettings() {
    chrome.runtime.openOptionsPage();
  }

  $: state = $stateStore;
  $: canPunch = state.status === 'working' || state.status === 'on-break' || state.status === 'not-started' || state.status === 'finished';
  $: layout = $settingsStore.popupLayout;
  $: Body = BODIES[layout];
</script>

<main style:width="{POPUP_LAYOUT_WIDTHS[layout]}px">
  <header class="identity">
    <span class="app-name">{$t('common.appName')}</span>
    <span class="actions">
      <button
        class="settings-link"
        on:click={cycleLayout}
        aria-label={$t('options.popupLayoutLabel')}
        title={$t(POPUP_LAYOUT_NAME_KEYS[layout])}
      >
        <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
          <path d="M1.5 1.5h6v6h-6v-6Zm7 0h6v3.5h-6v-3.5Zm0 5h6v6h-6v-6Zm-7 3h6v3h-6v-3Z" />
        </svg>
      </button>
      <button
        class="settings-link"
        class:spinning={refreshing}
        on:click={handleForceRefresh}
        disabled={refreshing}
        aria-label={$t('popup.forceRefresh')}
        title={$t('popup.forceRefresh')}
      >
        <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
          <path
            d="M8 2a6 6 0 1 1-5.29 3.17.75.75 0 0 1 1.32.7A4.5 4.5 0 1 0 8 3.5V5.75a.5.5 0 0 1-.82.38L4.4 3.88a.5.5 0 0 1 0-.76l2.78-2.25A.5.5 0 0 1 8 1.25V2Z"
          />
        </svg>
      </button>
      <button class="settings-link" on:click={openSettings} aria-label={$t('popup.openSettings')}>⚙</button>
    </span>
  </header>

  {#if state.status === 'checking'}
    <p class="message">{$t('popup.loadingMessage')}</p>
  {:else if state.status === 'not-logged-in'}
    <p class="message">{$t('popup.notLoggedInMessage')}</p>
    <a class="external" href="https://app.tradingworks.net/" target="_blank" rel="noreferrer">{$t('popup.goToTradingWorks')}</a>
  {:else if state.status === 'disabled'}
    <p class="message">{$t('popup.disabledMessage')}</p>
    <button class="external" on:click={openSettings}>{$t('popup.openSettings')}</button>
  {:else}
    <svelte:component this={Body} {state} {pending} {canPunch} onPunch={handlePunch} />
  {/if}

  {#if layout !== 'classic' && layout !== 'compact'}
    <EstimatedFinish workedMinutes={state.workedMinutes} status={state.status} lastUpdatedAt={state.lastUpdatedAt} />
  {/if}

  {#if state.lastUpdatedAt && layout !== 'classic'}
    <footer>
      {$t('popup.lastUpdated', { time: formatRelativeTime(state.lastUpdatedAt, now) })}
    </footer>
  {/if}
</main>

<style>
  main {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .identity {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .app-name {
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text-muted);
  }

  .actions {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .settings-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: none;
    cursor: pointer;
    font-size: 16px;
    color: var(--color-text-muted);
    padding: 2px;
    line-height: 1;
  }

  .settings-link:disabled {
    cursor: default;
    opacity: 0.6;
  }

  .settings-link.spinning {
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  .message {
    font-size: 14px;
    color: var(--color-text-muted);
    margin: 4px 0;
  }

  .external {
    display: inline-block;
    font-size: 13px;
    font-weight: 600;
    color: var(--color-brand);
    text-decoration: none;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
  }

  footer {
    font-size: 11px;
    color: var(--color-text-muted);
    text-align: center;
  }
</style>
