<script lang="ts">
  import type { TrackedState } from '../../lib/storage/schema';
  import { settingsStore } from '../../lib/storage/stores';
  import { minutesToTime } from '../../lib/domain/time';
  import { statusColor } from '../statusColors';
  import StatusPill from '../components/StatusPill.svelte';
  import PunchButton from '../components/PunchButton.svelte';

  export let state: TrackedState;
  export let pending: boolean;
  export let canPunch: boolean;
  export let onPunch: () => void;

  const RADIUS = 56;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

  $: goal = $settingsStore.dailyRequiredWorkMinutes;
  $: fraction = goal > 0 ? Math.min(Math.max(state.workedMinutes / goal, 0), 1) : 0;
  $: dashOffset = CIRCUMFERENCE * (1 - fraction);
  $: percent = Math.round(fraction * 100);
</script>

<div class="ring-body">
  <div class="ring-wrap">
    <svg viewBox="0 0 140 140" class="ring">
      <circle class="track" cx="70" cy="70" r={RADIUS} stroke-width="10" fill="none" />
      <circle
        class="progress"
        cx="70"
        cy="70"
        r={RADIUS}
        stroke-width="10"
        fill="none"
        stroke-linecap="round"
        stroke={statusColor(state.status)}
        stroke-dasharray={CIRCUMFERENCE}
        stroke-dashoffset={dashOffset}
        transform="rotate(-90 70 70)"
      />
    </svg>
    <div class="ring-center">
      <span class="worked">{minutesToTime(state.workedMinutes)}</span>
      <span class="percent">{percent}%</span>
    </div>
  </div>

  <StatusPill status={state.status} />

  {#if canPunch}
    <PunchButton status={state.status} {pending} {onPunch} />
  {/if}
</div>

<style>
  .ring-body {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
  }

  .ring-wrap {
    position: relative;
    width: 140px;
    height: 140px;
  }

  .ring {
    width: 100%;
    height: 100%;
  }

  .track {
    stroke: var(--color-border);
  }

  .progress {
    transition: stroke-dashoffset 0.4s ease;
  }

  .ring-center {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
  }

  .worked {
    font-family: var(--font-mono);
    font-size: 22px;
    font-weight: 600;
    color: var(--color-ink);
  }

  .percent {
    font-size: 12px;
    color: var(--color-text-muted);
  }
</style>
