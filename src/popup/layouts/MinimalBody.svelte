<script lang="ts">
  import type { TrackedState } from '../../lib/storage/schema';
  import LiveClock from '../components/LiveClock.svelte';
  import StatusPill from '../components/StatusPill.svelte';
  import PunchButton from '../components/PunchButton.svelte';
  import EstimatedFinish from '../components/EstimatedFinish.svelte';

  export let state: TrackedState;
  export let pending: boolean;
  export let canPunch: boolean;
  export let onPunch: () => void;
</script>

<div class="clock-wrap">
  <LiveClock size="large" />
  <StatusPill status={state.status} />
</div>

<EstimatedFinish workedMinutes={state.workedMinutes} status={state.status} lastUpdatedAt={state.lastUpdatedAt} />

{#if canPunch}
  <PunchButton status={state.status} {pending} {onPunch} />
{/if}

<style>
  .clock-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 4px 0;
  }
</style>
