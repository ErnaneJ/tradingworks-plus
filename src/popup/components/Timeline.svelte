<script lang="ts">
  import type { DayInterval, PunchEntry } from '../../lib/storage/schema';
  import { formatDurationHM, minutesToTime } from '../../lib/domain/time';
  import { settingsStore } from '../../lib/storage/stores';

  export let intervals: DayInterval[];
  export let punches: PunchEntry[] = [];
  export let size: 'normal' | 'large' = 'normal';

  const DAY_MINUTES = 24 * 60;
  /** Approximate pixel width of a "HH:mm" tick label at the ticks row's font size, used only to detect overlap. */
  const LABEL_WIDTH_PX = 34;

  let ticksWidth = 0;

  function currentMinutes(): number {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  }

  function parseTime(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }

  function startMinutes(interval: DayInterval): number {
    return parseTime(interval.start);
  }

  /** End of an interval in minutes since midnight; falls back to duration, then to the current time for an interval still in progress. */
  function endMinutes(interval: DayInterval): number {
    if (interval.end) return parseTime(interval.end);
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

  /**
   * Lays out one tick per given minute, centered on its actual point on the bar so it always
   * lines up with the mark it names. The track and the ticks row both keep a side margin equal
   * to half a label's width (see LABEL_WIDTH_PX / 2 below), so even a tick at the very start or
   * end of the bar has room to center without clipping. Any label whose estimated bounds collide
   * with the previous one is bumped to a second row instead of overlapping into unreadable text.
   */
  function buildTickRow(minutesList: number[], width: number) {
    const sorted = [...new Set(minutesList)].sort((a, b) => a - b);
    let row0RightEdge = -Infinity;
    return sorted.map((minutes) => {
      const leftPct = ((minutes - windowBounds.start) / windowMinutes) * 100;
      const leftPx = (leftPct / 100) * width;
      const leftEdge = leftPx - LABEL_WIDTH_PX / 2;
      const rightEdge = leftEdge + LABEL_WIDTH_PX;
      const row = leftEdge < row0RightEdge ? 1 : 0;
      if (row === 0) row0RightEdge = rightEdge;
      return { label: minutesToTime(minutes), leftPct, row };
    });
  }

  /**
   * Clock-in punches tick above the bar, clock-outs tick below it — since real punches already
   * alternate in/out, the two rows never compete for the same space, and a punch's row tells you
   * what kind of punch it was without reading the label. `ticksWidth` is passed explicitly (not
   * just closed over) so Svelte tracks it as a dependency and relayouts once the bar's real width
   * is known, instead of freezing every tick at the width-0 initial measurement.
   */
  $: aboveTicks = buildTickRow(punches.filter((punch) => punch.kind === 'in').map((punch) => parseTime(punch.time)), ticksWidth);
  $: belowTicks = buildTickRow(punches.filter((punch) => punch.kind === 'out').map((punch) => parseTime(punch.time)), ticksWidth);
  $: aboveHasTwoRows = aboveTicks.some((tick) => tick.row === 1);
  $: belowHasTwoRows = belowTicks.some((tick) => tick.row === 1);
</script>

{#if aboveTicks.length > 0}
  <div class="ticks ticks-above" class:tall={aboveHasTwoRows}>
    {#each aboveTicks as tick}
      <span class="tick" class:row-1={tick.row === 1} style:left="{tick.leftPct}%">{tick.label}</span>
    {/each}
  </div>
{/if}
<div class="track" class:large={size === 'large'} bind:clientWidth={ticksWidth}>
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
{#if belowTicks.length > 0}
  <div class="ticks ticks-below" class:tall={belowHasTwoRows}>
    {#each belowTicks as tick}
      <span class="tick" class:row-1={tick.row === 1} style:left="{tick.leftPct}%">{tick.label}</span>
    {/each}
  </div>
{/if}

<style>
  .track {
    position: relative;
    height: 8px;
    margin: 0 17px;
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
    margin-left: 17px;
    margin-right: 17px;
  }

  .ticks-above {
    margin-bottom: 4px;
  }

  .ticks-below {
    margin-top: 4px;
  }

  .ticks.tall {
    height: 26px;
  }

  .tick {
    position: absolute;
    transform: translateX(-50%);
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--color-text-muted);
    white-space: nowrap;
  }

  .ticks-below .tick {
    top: 0;
  }

  .ticks-below .tick.row-1 {
    top: 14px;
  }

  .ticks-above .tick {
    bottom: 0;
  }

  .ticks-above .tick.row-1 {
    bottom: 14px;
  }
</style>
