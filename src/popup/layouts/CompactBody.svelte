<script lang="ts">
  import type { TrackedState } from '../../lib/storage/schema';
  import StatusPill from '../components/StatusPill.svelte';
  import PunchButton from '../components/PunchButton.svelte';

  export let state: TrackedState;
  export let pending: boolean;
  export let canPunch: boolean;
  export let onPunch: () => void;
</script>

<div class="row">
  <StatusPill status={state.status} />
  {#if canPunch}
    <PunchButton status={state.status} {pending} {onPunch} compact />
  {/if}
</div>

<style>
  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
</style>
