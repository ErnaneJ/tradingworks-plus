<script lang="ts">
  import type { TrackedState } from '../../lib/storage/schema';
  import { t } from '../../lib/i18n';
  import LiveClock from '../components/LiveClock.svelte';
  import StatusPill from '../components/StatusPill.svelte';
  import PunchButton from '../components/PunchButton.svelte';
  import Timeline from '../components/Timeline.svelte';

  export let state: TrackedState;
  export let pending: boolean;
  export let canPunch: boolean;
  export let onPunch: () => void;
</script>

<div class="caption">
  <LiveClock size="small" />
  <StatusPill status={state.status} />
</div>

<section class="today">
  <div class="today-heading">
    <span>{$t('popup.todayHeading')}</span>
    <span class="punch-count">{$t('popup.punchCount', { count: state.punches.length })}</span>
  </div>
  {#if state.punches.length === 0}
    <p class="empty">{$t('popup.noPunchesYet')}</p>
  {:else}
    <Timeline intervals={state.intervals} size="large" />
  {/if}
</section>

{#if canPunch}
  <PunchButton status={state.status} {pending} {onPunch} />
{/if}

<style>
  .caption {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
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
</style>
