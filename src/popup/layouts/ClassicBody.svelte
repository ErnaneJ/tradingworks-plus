<script lang="ts">
  import type { TrackedState } from '../../lib/storage/schema';
  import StatusPill from '../components/StatusPill.svelte';
  import PunchButton from '../components/PunchButton.svelte';
  import ClassicView from '../components/ClassicView.svelte';

  export let state: TrackedState;
  export let pending: boolean;
  export let canPunch: boolean;
  export let onPunch: () => void;
</script>

<StatusPill status={state.status} />

{#if canPunch}
  <PunchButton status={state.status} {pending} {onPunch} />
{/if}

<ClassicView
  intervals={state.intervals}
  workedMinutes={state.workedMinutes}
  breakMinutes={state.breakMinutes}
  lastUpdatedAt={state.lastUpdatedAt}
/>
