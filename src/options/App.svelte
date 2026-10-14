<script lang="ts">
  import { t } from '../lib/i18n';
  import { initThemeSync } from '../lib/theme';
  import { stateStore } from '../lib/storage/stores';
  import TabRail from './components/TabRail.svelte';
  import DashboardTab from './tabs/DashboardTab.svelte';
  import GeneralTab from './tabs/GeneralTab.svelte';
  import NotificationsTab from './tabs/NotificationsTab.svelte';
  import HistoryTab from './tabs/HistoryTab.svelte';
  import TimeBankTab from './tabs/TimeBankTab.svelte';
  import TeamTab from './tabs/TeamTab.svelte';
  import AboutTab from './tabs/AboutTab.svelte';
  import ToastStack from './components/ToastStack.svelte';

  initThemeSync();

  const TAB_IDS = ['dashboard', 'general', 'notifications', 'history', 'timeBank', 'team', 'about'] as const;
  type TabId = (typeof TAB_IDS)[number];
  const DATA_TAB_IDS: TabId[] = ['dashboard', 'history', 'timeBank', 'team'];

  let active: TabId = 'dashboard';

  $: gated = DATA_TAB_IDS.includes(active) && $stateStore.status === 'not-logged-in';

  function setActive(id: string) {
    active = id as TabId;
  }

  function openProfile() {
    window.open('https://app.tradingworks.net/Registries/MyInformation.aspx', '_blank', 'noreferrer');
  }

  $: tabs = [
    { id: 'dashboard', label: $t('options.tabDashboard') },
    { id: 'general', label: $t('options.tabGeneral') },
    { id: 'notifications', label: $t('options.tabNotifications') },
    { id: 'history', label: $t('options.tabHistory') },
    { id: 'timeBank', label: $t('options.tabTimeBank') },
    { id: 'team', label: $t('options.tabTeam') },
    { id: 'about', label: $t('options.tabAbout') },
  ];
</script>

<div class="shell">
  <header>
    <span class="brand">
      <img src="/assets/icons/favicon32.png" alt="" width="24" height="24" />
      <h1>{$t('common.appName')}</h1>
    </span>
    {#if $stateStore.userName}
      <button type="button" class="user" on:click={openProfile}>
        {#if $stateStore.userPhotoUrl}
          <img class="avatar" src={$stateStore.userPhotoUrl} alt="" width="28" height="28" />
        {/if}
        <span class="user-name">{$stateStore.userName}</span>
      </button>
    {/if}
  </header>

  <div class="body">
    <TabRail {tabs} {active} onSelect={setActive} />

    <main>
      {#if gated}
        <p class="gate-message">{$t('popup.notLoggedInMessage')}</p>
        <a class="gate-link" href="https://app.tradingworks.net/" target="_blank" rel="noreferrer">
          {$t('popup.goToTradingWorks')}
        </a>
      {:else if active === 'dashboard'}
        <DashboardTab />
      {:else if active === 'general'}
        <GeneralTab />
      {:else if active === 'notifications'}
        <NotificationsTab />
      {:else if active === 'history'}
        <HistoryTab />
      {:else if active === 'timeBank'}
        <TimeBankTab />
      {:else if active === 'team'}
        <TeamTab />
      {:else if active === 'about'}
        <AboutTab />
      {/if}
    </main>
  </div>
</div>

<ToastStack />

<style>
  .shell {
    width: 100%;
    max-width: 640px;
    margin: 0 auto;
    padding: 24px;
    box-sizing: border-box;
  }

  @media (min-width: 640px) {
    .shell {
      max-width: 640px;
    }
  }

  @media (min-width: 768px) {
    .shell {
      max-width: 768px;
    }
  }

  @media (min-width: 1024px) {
    .shell {
      max-width: 1024px;
    }
  }

  @media (min-width: 1280px) {
    .shell {
      max-width: 1280px;
    }
  }

  @media (min-width: 1536px) {
    .shell {
      max-width: 1536px;
    }
  }

  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin: 0 0 20px;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  header h1 {
    font-size: 18px;
    margin: 0;
  }

  .user {
    display: flex;
    align-items: center;
    gap: 8px;
    background: none;
    border: none;
    padding: 0;
    margin: 0;
    font: inherit;
    cursor: pointer;
  }

  .avatar {
    border-radius: 50%;
    object-fit: cover;
  }

  .user-name {
    font-size: 14px;
    font-weight: 600;
    color: var(--color-ink);
  }

  .body {
    display: flex;
    gap: 24px;
    align-items: flex-start;
  }

  main {
    flex: 1;
    min-width: 0;
    background: var(--color-surface-raised);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: 20px 24px;
  }

  .gate-message {
    font-size: 14px;
    color: var(--color-text-muted);
    margin: 0 0 8px;
  }

  .gate-link {
    display: inline-block;
    font-size: 14px;
    font-weight: 600;
    color: var(--color-brand);
    text-decoration: none;
  }

  .gate-link:hover {
    text-decoration: underline;
  }
</style>
