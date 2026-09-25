<script lang="ts">
  import { t } from '../../lib/i18n';
  import { stateStore, settingsStore } from '../../lib/storage/stores';
  import { minutesToTime } from '../../lib/domain/time';
  import StatusPill from '../../popup/components/StatusPill.svelte';
  import StatRow from '../../popup/components/StatRow.svelte';
  import Timeline from '../../popup/components/Timeline.svelte';
  import BarChart from '../components/BarChart.svelte';

  const HISTORY_DAYS = 14;
  const TIME_BANK_MONTHS = 12;

  $: state = $stateStore;
  $: settings = $settingsStore;

  $: workedPoints = state.attendanceHistory
    .slice(0, HISTORY_DAYS)
    .filter((row) => row.workedMinutes !== null)
    .reverse()
    .map((row) => ({
      label: row.date,
      value: row.workedMinutes ?? 0,
      tone: (row.workedMinutes ?? 0) >= settings.dailyRequiredWorkMinutes ? ('positive' as const) : ('neutral' as const),
    }));

  $: timeBankPoints = state.monthlyTimeBankHistory
    .slice(0, TIME_BANK_MONTHS)
    .filter((row) => row.balanceMinutes !== null)
    .reverse()
    .map((row) => ({
      label: row.period,
      value: row.balanceMinutes ?? 0,
      tone: (row.balanceMinutes ?? 0) < 0 ? ('negative' as const) : ('positive' as const),
    }));
</script>

<div class="page-header">
  <h1>{$t('dashboard.title')}</h1>
  <StatusPill status={state.status} />
</div>

<section class="card">
  <div class="summary">
    <StatRow workedMinutes={state.workedMinutes} breakMinutes={state.breakMinutes} timeBankMinutes={state.timeBankMinutes} />
  </div>
  {#if state.punches.length > 0}
    <Timeline intervals={state.intervals} />
  {/if}
</section>

{#if state.attendanceAlerts.length > 0}
  <section class="card">
    <h2>{$t('dashboard.alertsHeading')}</h2>
    <ul class="alerts">
      {#each state.attendanceAlerts as alert (alert.id)}
        <li>
          <span class="alert-label">{alert.label}</span>
          <span class="alert-count">{alert.count}</span>
        </li>
      {/each}
    </ul>
  </section>
{/if}

<section class="card">
  <h2>{$t('dashboard.workedChartHeading')}</h2>
  <p class="hint">{$t('dashboard.goalHint', { time: minutesToTime(settings.dailyRequiredWorkMinutes) })}</p>
  {#if workedPoints.length > 0}
    <BarChart points={workedPoints} formatValue={minutesToTime} goalValue={settings.dailyRequiredWorkMinutes} />
  {:else}
    <p class="empty">{$t('history.emptyState')}</p>
  {/if}
</section>

<section class="card">
  <h2>{$t('dashboard.timeBankChartHeading')}</h2>
  {#if timeBankPoints.length > 0}
    <BarChart points={timeBankPoints} formatValue={minutesToTime} goalValue={0} />
  {:else}
    <p class="empty">{$t('history.emptyState')}</p>
  {/if}
</section>

<style>
  .page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin: 0 0 16px;
  }

  h1 {
    font-size: 20px;
    margin: 0;
  }

  h2 {
    font-size: 14px;
    margin: 0 0 12px;
  }

  .card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: 16px 20px;
    margin-bottom: 16px;
  }

  .summary {
    max-width: 420px;
    margin: 0 auto 16px;
  }

  .summary :global(.value) {
    font-size: 26px;
  }

  .summary :global(.label) {
    font-size: 13px;
  }

  .hint {
    font-size: 12px;
    color: var(--color-text-muted);
    margin: -6px 0 12px;
  }

  .empty {
    font-size: 13px;
    color: var(--color-text-muted);
    margin: 0;
  }

  .alerts {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .alerts li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 13px;
    padding: 8px 12px;
    background: var(--color-surface-raised);
    border-radius: var(--radius-sm);
  }

  .alert-count {
    font-family: var(--font-mono);
    font-weight: 600;
    color: var(--color-break);
  }
</style>
