<script lang="ts">
  import { t } from '../../lib/i18n';
  import { settingsStore } from '../../lib/storage/stores';
  import { sendWebhook } from '../../lib/notify/webhook';
  import { sendDiscordNotification } from '../../lib/notify/discord';
  import { showBrowserNotification } from '../../lib/notify/browser';
  import { renderEvent } from '../../lib/notify/render';
  import type { NotificationEvent } from '../../lib/notify/events';
  import { NOTIFICATION_EVENT_KINDS, type NotificationChannel } from '../../lib/storage/schema';
  import Toggle from '../components/Toggle.svelte';
  import { pushToast } from '../lib/toast';

  /** Sample payload per event kind, so the test button previews the actual rendered message. */
  const SAMPLE_EVENTS: Record<(typeof NOTIFICATION_EVENT_KINDS)[number], NotificationEvent> = {
    'settings-changed': { kind: 'settings-changed' },
    'punch-in': { kind: 'punch-in' },
    'punch-out': { kind: 'punch-out' },
    'break-finished': { kind: 'break-finished' },
    'shift-ending-soon': { kind: 'shift-ending-soon', minutesLeft: 15 },
    'break-ending-soon': { kind: 'break-ending-soon', minutesLeft: 5 },
    'shift-finished': { kind: 'shift-finished' },
    'overtime-threshold': { kind: 'overtime-threshold', minutes: 30 },
    'attendance-alert': { kind: 'attendance-alert', label: $t('notifications.eventAttendanceAlert'), count: 1 },
  };

  const CHANNELS: NotificationChannel[] = ['browser', 'webhook', 'discord'];

  let browserPermission: 'granted' | 'denied' | null = null;
  chrome.notifications.getPermissionLevel((level) => {
    browserPermission = level as 'granted' | 'denied';
  });

  const EVENT_LABEL_KEYS: Record<(typeof NOTIFICATION_EVENT_KINDS)[number], string> = {
    'settings-changed': 'notifications.eventSettingsChanged',
    'punch-in': 'notifications.eventPunchIn',
    'punch-out': 'notifications.eventPunchOut',
    'break-finished': 'notifications.eventBreakFinished',
    'shift-ending-soon': 'notifications.eventShiftEndingSoon',
    'break-ending-soon': 'notifications.eventBreakEndingSoon',
    'shift-finished': 'notifications.eventShiftFinished',
    'overtime-threshold': 'notifications.eventOvertimeThreshold',
    'attendance-alert': 'notifications.eventAttendanceAlert',
  };

  function updateWebhook(patch: Partial<typeof $settingsStore.webhook>) {
    settingsStore.update((current) => ({ ...current, webhook: { ...current.webhook, ...patch } }));
  }

  function updateDiscord(patch: Partial<typeof $settingsStore.discord>) {
    settingsStore.update((current) => ({ ...current, discord: { ...current.discord, ...patch } }));
  }

  function toggleChannel(kind: string, channel: NotificationChannel, value: boolean) {
    settingsStore.update((current) => ({
      ...current,
      notificationChannels: {
        ...current.notificationChannels,
        [kind]: { ...current.notificationChannels[kind], [channel]: value },
      },
    }));
  }

  async function testRow(kind: (typeof NOTIFICATION_EVENT_KINDS)[number]) {
    const channels = $settingsStore.notificationChannels[kind];
    const payload = renderEvent(SAMPLE_EVENTS[kind], $t);
    try {
      if (channels?.browser) showBrowserNotification(payload);
      if (channels?.webhook && $settingsStore.webhook.url) await sendWebhook($settingsStore.webhook.url, payload);
      if (channels?.discord && $settingsStore.discord.url) await sendDiscordNotification($settingsStore.discord.url, payload);
      pushToast($t('notifications.testSent'), 'success');
    } catch {
      pushToast($t('notifications.testFailed'), 'error');
    }
  }
</script>

<h1>{$t('options.tabNotifications')}</h1>

<section class="field-row">
  <div class="field-text">
    <h2>{$t('notifications.webhookSectionTitle')}</h2>
    <p class="hint">{$t('notifications.webhookSectionHint')}</p>
  </div>
  <input
    type="url"
    placeholder={$t('notifications.webhookUrlPlaceholder')}
    value={$settingsStore.webhook.url}
    on:change={(event) => updateWebhook({ url: event.currentTarget.value })}
  />
</section>

<section class="field-row">
  <div class="field-text">
    <h2>{$t('notifications.discordSectionTitle')}</h2>
    <p class="hint">{$t('notifications.discordSectionHint')}</p>
  </div>
  <input
    type="url"
    placeholder={$t('notifications.discordUrlPlaceholder')}
    value={$settingsStore.discord.url}
    on:change={(event) => updateDiscord({ url: event.currentTarget.value })}
  />
</section>

<section>
  <h2>{$t('notifications.matrixHeading')}</h2>
  <p class="hint">{$t('notifications.matrixHint')}</p>

  <table class="matrix">
    <thead>
      <tr>
        <th class="event-col">{$t('notifications.matrixEventColumn')}</th>
        {#each CHANNELS as channel}
          <th>{$t(`notifications.matrixChannel${channel.charAt(0).toUpperCase()}${channel.slice(1)}`)}</th>
        {/each}
        <th>{$t('notifications.matrixTestColumn')}</th>
      </tr>
    </thead>
    <tbody>
      {#each NOTIFICATION_EVENT_KINDS as kind (kind)}
        <tr>
          <td class="event-col">{$t(EVENT_LABEL_KEYS[kind])}</td>
          {#each CHANNELS as channel}
            <td>
              <Toggle
                checked={$settingsStore.notificationChannels[kind]?.[channel] ?? false}
                onChange={(value) => toggleChannel(kind, channel, value)}
              />
            </td>
          {/each}
          <td class="test-cell">
            <button on:click={() => testRow(kind)}>{$t('common.test')}</button>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>

  <p class="permission-note" class:warn={browserPermission === 'denied'}>
    {browserPermission === 'denied' ? $t('notifications.browserPermissionDenied') : $t('notifications.browserPermissionHint')}
  </p>
</section>

<style>
  h1 {
    font-size: 20px;
    margin: 0 0 8px;
  }

  h2 {
    font-size: 15px;
    margin: 0;
  }

  .hint {
    font-size: 12px;
    color: var(--color-text-muted);
    margin: 2px 0 0;
  }

  .field-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    margin-top: 24px;
  }

  .field-row:first-child {
    margin-top: 0;
  }

  .field-text {
    min-width: 0;
  }

  input[type='url'] {
    font-family: inherit;
    font-size: 14px;
    padding: 8px 12px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-surface-raised);
    color: var(--color-ink);
    width: 100%;
    max-width: 320px;
    flex-shrink: 0;
  }

  button {
    font-family: inherit;
    font-size: 13px;
    padding: 6px 12px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-surface-raised);
    color: var(--color-ink);
    cursor: pointer;
  }

  .matrix {
    width: 100%;
    border-collapse: collapse;
    margin-top: 8px;
    font-size: 13px;
  }

  .matrix th,
  .matrix td {
    padding: 8px 10px;
    text-align: center;
    border-bottom: 1px solid var(--color-border);
  }

  .matrix .event-col {
    text-align: left;
  }

  .test-cell {
    text-align: center;
  }

  .permission-note {
    font-size: 12px;
    color: var(--color-text-muted);
    margin: 10px 0 0;
  }

  .permission-note.warn {
    color: var(--color-danger);
  }
</style>
