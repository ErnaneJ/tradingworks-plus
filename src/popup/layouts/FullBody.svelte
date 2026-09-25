<script lang="ts">
  import type { TrackedState } from '../../lib/storage/schema';
  import { t } from '../../lib/i18n';
  import StatusPill from '../components/StatusPill.svelte';
  import LiveClock from '../components/LiveClock.svelte';
  import PunchButton from '../components/PunchButton.svelte';
  import Timeline from '../components/Timeline.svelte';
  import StatRow from '../components/StatRow.svelte';
  import EstimatedFinish from '../components/EstimatedFinish.svelte';

  export let state: TrackedState;
  export let pending: boolean;
  export let canPunch: boolean;
  export let onPunch: () => void;
</script>

<section class="hero">
  <LiveClock size="large" />
  <StatusPill status={state.status} />
</section>

<EstimatedFinish workedMinutes={state.workedMinutes} status={state.status} lastUpdatedAt={state.lastUpdatedAt} />

{#if canPunch}
  <PunchButton status={state.status} {pending} {onPunch} />
{/if}

{#if state.attendanceAlerts.length > 0}
  <hr />
  <ul class="alerts">
    {#each state.attendanceAlerts as alert (alert.id)}
      <li>
        <span>{alert.label}</span>
        <span class="alert-count">{alert.count}</span>
      </li>
    {/each}
  </ul>
{/if}

<hr />

<section class="today">
  <div class="today-heading">
    <span>{$t('popup.todayHeading')}</span>
    <span class="punch-count">{$t('popup.punchCount', { count: state.punches.length })}</span>
  </div>
  {#if state.punches.length === 0}
    <p class="empty">{$t('popup.noPunchesYet')}</p>
  {:else}
    <Timeline intervals={state.intervals} punches={state.punches} size="normal" />
  {/if}
</section>

<hr />

<StatRow workedMinutes={state.workedMinutes} breakMinutes={state.breakMinutes} timeBankMinutes={state.timeBankMinutes} layout="grid" />

<style>
  .hero {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  hr {
    border: none;
    border-top: 1px solid var(--color-border);
    margin: 0;
  }

  .today {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .today-heading {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: var(--color-text-muted);
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
    gap: 6px;
  }

  .alerts li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 12px;
    padding: 6px 10px;
    background: var(--color-surface);
    border-radius: var(--radius-sm);
  }

  .alert-count {
    font-family: var(--font-mono);
    font-weight: 600;
    color: var(--color-break);
  }
</style>
