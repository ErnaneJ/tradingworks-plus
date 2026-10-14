<script lang="ts">
  import { onDestroy } from 'svelte';
  import type { TrackedState } from '../../lib/storage/schema';
  import { settingsStore } from '../../lib/storage/stores';
  import { minutesToTime, formatDurationHMm } from '../../lib/domain/time';
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
  $: percent = Math.round(fraction * 100);

  /**
   * Splits the ring into one arc per worked/break interval, in order, each sized
   * by its share of the daily goal — so the ring reads like the linear timeline
   * bar: worked time in one color, break time in another, instead of a single
   * flat progress color. Capped at a full lap so a long break or overtime
   * doesn't wrap an arc back over an earlier one.
   */
  $: segments = (() => {
    if (goal <= 0) return [];
    let cumulative = 0;
    const result: { kind: string; rotation: number; dashArray: string }[] = [];
    for (const interval of state.intervals) {
      if (cumulative >= 1) break;
      const duration = interval.durationMinutes ?? 0;
      if (duration <= 0) continue;
      const length = Math.min(duration / goal, 1 - cumulative);
      result.push({
        kind: interval.kind,
        rotation: -90 + cumulative * 360,
        dashArray: `${length * CIRCUMFERENCE} ${CIRCUMFERENCE}`,
      });
      cumulative += length;
    }
    return result;
  })();

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
      {#each segments as segment}
        <circle
          class="progress"
          class:break={segment.kind === 'break'}
          cx="70"
          cy="70"
          r={RADIUS}
          stroke-width="10"
          fill="none"
          stroke-linecap="round"
          stroke-dasharray={segment.dashArray}
          transform="rotate({segment.rotation} 70 70)"
        />
      {/each}
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
    stroke: var(--color-working);
    transition: stroke-dasharray 0.4s ease;
  }

  .progress.break {
    stroke: var(--color-break);
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
