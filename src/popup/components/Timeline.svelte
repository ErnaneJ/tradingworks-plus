<script lang="ts">
  import type { DayInterval } from '../../lib/storage/schema';
  import { formatDurationHM, minutesToTime, timeToMinutes } from '../../lib/domain/time';
  import { t } from '../../lib/i18n';

  export let intervals: DayInterval[];
  export let size: 'normal' | 'large' = 'normal';

  const DAY_MINUTES = 24 * 60;
  /** Minutes of breathing room added on each side of the active window. */
  const WINDOW_PADDING = 20;

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
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  }

  /** Re-formats an "HH:mm"-ish time through minutesToTime so it's always zero-padded, regardless of the source formatting. */
  function formatTime(value: string): string {
    const minutes = timeToMinutes(value);
    return minutes === null ? value : minutesToTime(minutes);
  }

  /** Zooms the track to the day's actual activity span instead of the full 24h, so segments stay legible at popup width. */
  $: windowBounds = (() => {
    if (intervals.length === 0) return { start: 8 * 60, end: 18 * 60 };
    const rawStart = Math.min(...intervals.map(startMinutes));
    const rawEnd = Math.max(...intervals.map(endMinutes));
    const start = Math.max(Math.floor((rawStart - WINDOW_PADDING) / 60) * 60, 0);
    let end = Math.min(Math.ceil((rawEnd + WINDOW_PADDING) / 60) * 60, DAY_MINUTES);
    if (end - start < 60) end = Math.min(start + 60, DAY_MINUTES);
    return { start, end };
  })();

  $: windowMinutes = windowBounds.end - windowBounds.start;

  $: segments = intervals.map((interval) => ({
    ...interval,
    leftPct: ((startMinutes(interval) - windowBounds.start) / windowMinutes) * 100,
    widthPct: Math.max(((endMinutes(interval) - startMinutes(interval)) / windowMinutes) * 100, 1.2),
    tooltip: $t('popup.timelineTooltip', {
      start: formatTime(interval.start),
      end: interval.end ? formatTime(interval.end) : '…',
      duration: formatDurationHM(interval.durationMinutes ?? 0),
    }),
  }));

  function formatBoundary(totalMinutes: number): string {
    return minutesToTime(((totalMinutes % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES);
  }
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
<div class="ticks">
  <span>{formatBoundary(windowBounds.start)}</span>
  <span>{formatBoundary(windowBounds.end)}</span>
</div>

<style>
  .track {
    position: relative;
    height: 8px;
    border-radius: 4px;
    background: var(--color-border);
    overflow: hidden;
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
    display: flex;
    justify-content: space-between;
    margin-top: 4px;
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--color-text-muted);
  }
</style>
