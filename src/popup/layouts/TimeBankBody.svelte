<script lang="ts">
  import type { TrackedState } from '../../lib/storage/schema';
  import { t } from '../../lib/i18n';
  import { minutesToTime } from '../../lib/domain/time';
  import StatusPill from '../components/StatusPill.svelte';
  import LiveClock from '../components/LiveClock.svelte';
  import PunchButton from '../components/PunchButton.svelte';

  export let state: TrackedState;
  export let pending: boolean;
  export let canPunch: boolean;
  export let onPunch: () => void;

  const TREND_MONTHS = 6;

  $: timeBankLabel = state.timeBankMinutes === null ? '—' : minutesToTime(state.timeBankMinutes);
  $: timeBankTone = state.timeBankMinutes === null ? 'neutral' : state.timeBankMinutes < 0 ? 'negative' : state.timeBankMinutes > 0 ? 'positive' : 'neutral';

  $: trend = state.monthlyTimeBankHistory.slice(0, TREND_MONTHS);
  $: maxAbsBalance = Math.max(...trend.map((row) => Math.abs(row.balanceMinutes ?? 0)), 1);
</script>

<div class="caption">
  <LiveClock size="small" />
  <StatusPill status={state.status} />
</div>

<section class="hero">
  <span class="hero-value tone-{timeBankTone}">{timeBankLabel}</span>
  <span class="hero-label">{$t('popup.timeBankLabel')}</span>
</section>

<section class="trend">
  <h2>{$t('dashboard.timeBankChartHeading')}</h2>
  {#if trend.length === 0}
    <p class="empty">{$t('history.emptyState')}</p>
  {:else}
    {#each trend as row (row.period)}
      <div class="trend-row">
        <span class="period">{row.period}</span>
        <div class="bar-track">
          {#if row.balanceMinutes !== null}
            <div
              class="bar-fill"
              class:tone-negative={row.balanceMinutes < 0}
              style:width="{(Math.abs(row.balanceMinutes) / maxAbsBalance) * 100}%"
            />
          {/if}
        </div>
        <span class="balance">{row.balanceMinutes !== null ? minutesToTime(row.balanceMinutes) : '—'}</span>
      </div>
    {/each}
  {/if}
</section>

<hr />

<div class="compact-row">
  <div class="stat">
    <span class="value">{minutesToTime(state.workedMinutes)}</span>
    <span class="label">{$t('popup.workedLabel')}</span>
  </div>
  <div class="stat">
    <span class="value">{minutesToTime(state.breakMinutes)}</span>
    <span class="label">{$t('popup.breakLabel')}</span>
  </div>
</div>

{#if canPunch}
  <PunchButton status={state.status} {pending} {onPunch} />
{/if}

<style>
  .caption {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  hr {
    border: none;
    border-top: 1px solid var(--color-border);
    margin: 0;
  }

  .hero {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 4px 0;
  }

  .hero-value {
    font-family: var(--font-mono);
    font-size: 32px;
    font-weight: 700;
  }

  .hero-value.tone-negative {
    color: var(--color-danger);
  }

  .hero-value.tone-positive {
    color: var(--color-brand);
  }

  .hero-label {
    font-size: 12px;
    color: var(--color-text-muted);
  }

  .trend {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .trend h2 {
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

  .trend-row {
    display: grid;
    grid-template-columns: 48px 1fr 56px;
    align-items: center;
    gap: 8px;
  }

  .period {
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
    background: var(--color-brand);
    border-radius: var(--radius-sm);
  }

  .bar-fill.tone-negative {
    background: var(--color-danger);
  }

  .balance {
    font-family: var(--font-mono);
    font-size: 12px;
    text-align: right;
  }

  .compact-row {
    display: flex;
    justify-content: space-between;
    gap: 8px;
  }

  .stat {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
  }

  .value {
    font-family: var(--font-mono);
    font-size: 17px;
    font-weight: 600;
  }

  .label {
    font-size: 12px;
    color: var(--color-text-muted);
  }
</style>
