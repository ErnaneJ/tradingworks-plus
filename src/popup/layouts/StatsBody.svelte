<script lang="ts">
  import type { TrackedState } from '../../lib/storage/schema';
  import LiveClock from '../components/LiveClock.svelte';
  import StatusPill from '../components/StatusPill.svelte';
  import PunchButton from '../components/PunchButton.svelte';
  import StatRow from '../components/StatRow.svelte';
  import EstimatedFinish from '../components/EstimatedFinish.svelte';

  export let state: TrackedState;
  export let pending: boolean;
  export let canPunch: boolean;
  export let onPunch: () => void;
</script>

<div class="caption">
  <LiveClock size="small" />
  <StatusPill status={state.status} />
</div>

<EstimatedFinish workedMinutes={state.workedMinutes} status={state.status} lastUpdatedAt={state.lastUpdatedAt} />

<StatRow workedMinutes={state.workedMinutes} breakMinutes={state.breakMinutes} timeBankMinutes={state.timeBankMinutes} layout="grid" />

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
</style>
