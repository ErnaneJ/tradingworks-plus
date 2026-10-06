<script lang="ts">
  import type { TrackedState } from '../../lib/storage/schema';
  import { t } from '../../lib/i18n';
  import { settingsStore } from '../../lib/storage/stores';
  import { minutesToTime } from '../../lib/domain/time';
  import StatusPill from '../components/StatusPill.svelte';
  import PunchButton from '../components/PunchButton.svelte';
  import StatRow from '../components/StatRow.svelte';

  export let state: TrackedState;
  export let pending: boolean;
  export let canPunch: boolean;
  export let onPunch: () => void;

  const WEEK_DAYS = 7;

  $: goal = $settingsStore.dailyRequiredWorkMinutes;
  $: weekRows = state.attendanceHistory.slice(0, WEEK_DAYS);
</script>

<div class="caption">
  <StatusPill status={state.status} />
</div>

<section class="week">
  <h2>{$t('dashboard.workedChartHeading')}</h2>
  {#if weekRows.length === 0}
    <p class="empty">{$t('history.emptyState')}</p>
  {:else}
    {#each weekRows as row (row.date)}
      <div class="day-row">
        <span class="date">{row.date}</span>
        <div class="bar-track">
          {#if row.workedMinutes !== null}
            <div
              class="bar-fill"
              class:tone-positive={row.workedMinutes >= goal}
              style:width="{Math.min((row.workedMinutes / goal) * 100, 100)}%"
            />
          {/if}
        </div>
        <span class="worked">{row.workedMinutes !== null ? minutesToTime(row.workedMinutes) : '—'}</span>
      </div>
    {/each}
  {/if}
</section>

<hr />

<StatRow workedMinutes={state.workedMinutes} breakMinutes={state.breakMinutes} timeBankMinutes={state.timeBankMinutes} layout="row" />

{#if canPunch}
  <PunchButton status={state.status} {pending} {onPunch} />
{/if}

<style>
  .caption {
    display: flex;
    justify-content: flex-end;
  }

  hr {
    border: none;
    border-top: 1px solid var(--color-border);
    margin: 0;
  }

  .week {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .week h2 {
    margin: 0 0 2px;
    font-size: 12px;
    font-weight: 500;
    color: var(--color-text-muted);
  }

  .empty {
    font-size: 13px;
    color: var(--color-text-muted);
    margin: 0;
  }

  .day-row {
    display: grid;
    grid-template-columns: 44px 1fr 48px;
    align-items: center;
    gap: 8px;
  }

  .date {
    font-size: 12px;
    color: var(--color-text-muted);
  }

  .bar-track {
    height: 8px;
    border-radius: var(--radius-sm);
    background: var(--color-surface-raised);
    border: 1px solid var(--color-border);
    overflow: hidden;
  }

  .bar-fill {
    height: 100%;
    background: var(--color-working);
    border-radius: var(--radius-sm);
  }

  .bar-fill.tone-positive {
    background: var(--color-brand);
  }

  .worked {
    font-family: var(--font-mono);
    font-size: 12px;
    text-align: right;
  }
</style>
