<script lang="ts">
  import { onDestroy } from 'svelte';
  import type { TrackedState } from '../../lib/storage/schema';
  import { settingsStore } from '../../lib/storage/stores';
  import { minutesToTime, formatDurationHMm } from '../../lib/domain/time';
  import { statusColor } from '../statusColors';
  import StatusPill from '../components/StatusPill.svelte';
  import PunchButton from '../components/PunchButton.svelte';

  export let state: TrackedState;
  export let pending: boolean;
  export let canPunch: boolean;
  export let onPunch: () => void;

  const RADIUS = 56;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

  let now = new Date();
  const timer = setInterval(() => {
    now = new Date();
  }, 1000);
  onDestroy(() => clearInterval(timer));

  $: goal = $settingsStore.dailyRequiredWorkMinutes;
  $: fraction = goal > 0 ? Math.min(Math.max(state.workedMinutes / goal, 0), 1) : 0;
  $: dashOffset = CIRCUMFERENCE * (1 - fraction);
  $: percent = Math.round(fraction * 100);

  $: firstPunchTime = state.punches[0]?.time ?? null;
  $: lastPunchTime = state.punches[state.punches.length - 1]?.time ?? null;
  $: liveTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  $: endLabel = state.status === 'finished' ? lastPunchTime : liveTime;
  $: tooltip = firstPunchTime && endLabel ? `${firstPunchTime} - ${endLabel} (${formatDurationHMm(state.workedMinutes)})` : null;
</script>

<div class="ring-body">
  <div class="ring-wrap" data-tooltip={tooltip}>
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

  /*
   * Pure-CSS tooltip: shows on hover with no delay, unlike the native
   * `title` attribute. `data-tooltip` holds the pre-formatted text.
   */
  .ring-wrap[data-tooltip]::after {
    content: attr(data-tooltip);
    position: absolute;
    top: calc(100% + 8px);
    left: 50%;
    transform: translateX(-50%);
    padding: 4px 8px;
    border-radius: 4px;
    background: var(--color-tooltip-bg, #1f2937);
    color: var(--color-tooltip-text, #fff);
    font-size: 11px;
    line-height: 1.3;
    white-space: nowrap;
    pointer-events: none;
    opacity: 0;
    visibility: hidden;
    z-index: 10;
  }

  .ring-wrap[data-tooltip]:hover::after {
    opacity: 1;
    visibility: visible;
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
