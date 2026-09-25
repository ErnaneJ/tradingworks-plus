<script lang="ts">
  import type { DayInterval } from '../../lib/storage/schema';
  import { formatDurationHM, minutesToTime } from '../../lib/domain/time';
  import { settingsStore } from '../../lib/storage/stores';

  export let intervals: DayInterval[];
  export let size: 'normal' | 'large' = 'normal';

  const DAY_MINUTES = 24 * 60;

  function currentMinutes(): number {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  }

  function startMinutes(interval: DayInterval): number {
    const [h, m] = interval.start.split(':').map(Number);
    return h * 60 + m;
  }

  /** End of an interval in minutes since midnight; falls back to duration, then to the current time for an interval still in progress. */
  function endMinutes(interval: DayInterval): number {
    if (interval.end) {
      const [h, m] = interval.end.split(':').map(Number);
      return h * 60 + m;
    }
    if (interval.durationMinutes !== null) return startMinutes(interval) + interval.durationMinutes;
    return currentMinutes();
  }

  /** Duration for a still-open interval (no end, no known duration): minutes elapsed since its start, so it doesn't read as a false 00h00. */
  function liveDuration(interval: DayInterval): number {
    if (interval.durationMinutes !== null) return interval.durationMinutes;
    const elapsed = currentMinutes() - startMinutes(interval);
    return elapsed >= 0 ? elapsed : 0;
  }

  /** Planned length of the day: the configured work goal plus the planned break, so the bar grows past this only once the day actually runs long. */
  $: plannedMinutes = $settingsStore.dailyRequiredWorkMinutes + $settingsStore.breakDurationMinutes;

  $: windowBounds = (() => {
    if (intervals.length === 0) {
      const start = currentMinutes();
      return { start, end: Math.min(start + plannedMinutes, DAY_MINUTES) };
    }
    const start = Math.min(...intervals.map(startMinutes));
    const rawEnd = Math.max(...intervals.map(endMinutes));
    const end = Math.min(Math.max(rawEnd, start + plannedMinutes), DAY_MINUTES);
    return { start, end };
  })();

  $: windowMinutes = Math.max(windowBounds.end - windowBounds.start, 1);

  $: segments = intervals.map((interval) => ({
    ...interval,
    leftPct: ((startMinutes(interval) - windowBounds.start) / windowMinutes) * 100,
    widthPct: Math.max(((endMinutes(interval) - startMinutes(interval)) / windowMinutes) * 100, 1.2),
    tooltip: formatDurationHM(liveDuration(interval)),
  }));

  /** One tick per actual punch (never a synthetic "now" for an interval still open), deduped so a back-to-back punch-out/punch-in pair only labels once. */
  $: tickMarks = (() => {
    const byMinute = new Map<number, string>();
    for (const interval of intervals) {
      const start = startMinutes(interval);
      if (!byMinute.has(start)) byMinute.set(start, minutesToTime(start));
      if (interval.end) {
        const end = endMinutes(interval);
        if (!byMinute.has(end)) byMinute.set(end, minutesToTime(end));
      }
    }
    const sorted = [...byMinute.entries()].sort((a, b) => a[0] - b[0]);
    return sorted.map(([minutes, label], index) => ({
      label,
      leftPct: ((minutes - windowBounds.start) / windowMinutes) * 100,
      align: index === 0 ? 'left' : index === sorted.length - 1 ? 'right' : 'center',
    }));
  })();
</script>

<div class="track" class:large={size === 'large'}>
  {#each segments as segment}
    <div
      class="segment"
      class:break={segment.kind === 'break'}
      style:left="{segment.leftPct}%"
      style:width="{segment.widthPct}%"
      data-tooltip={segment.tooltip}
    />
  {/each}
</div>
{#if tickMarks.length > 0}
  <div class="ticks">
    {#each tickMarks as tick}
      <span class="tick align-{tick.align}" style:left="{tick.leftPct}%">{tick.label}</span>
    {/each}
  </div>
{/if}

<style>
  .track {
    position: relative;
    height: 8px;
    border-radius: 4px;
    background: var(--color-border);
  }

  .track.large {
    height: 28px;
    border-radius: 6px;
  }

  .segment {
    position: absolute;
    top: 0;
    bottom: 0;
    background: var(--color-working);
    border-radius: 4px;
  }

  .segment.break {
    background: var(--color-break);
  }

  /*
   * Pure-CSS tooltip: shows on hover with no delay, unlike the native
   * `title` attribute. `data-tooltip` holds the pre-formatted text.
   */
  .segment::after {
    content: attr(data-tooltip);
    position: absolute;
    bottom: calc(100% + 6px);
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

  .segment:hover::after {
    opacity: 1;
    visibility: visible;
  }

  .ticks {
    position: relative;
    height: 12px;
    margin-top: 4px;
  }

  .tick {
    position: absolute;
    top: 0;
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--color-text-muted);
    white-space: nowrap;
  }

  .tick.align-left {
    transform: translateX(0);
  }

  .tick.align-right {
    transform: translateX(-100%);
  }

  .tick.align-center {
    transform: translateX(-50%);
  }
</style>
