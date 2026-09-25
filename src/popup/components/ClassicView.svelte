<script lang="ts">
  import type { DayInterval } from '../../lib/storage/schema';
  import { formatDurationHMm, minutesToTime } from '../../lib/domain/time';
  import { t, locale } from '../../lib/i18n';

  export let intervals: DayInterval[];
  export let workedMinutes: number;
  export let breakMinutes: number;
  export let lastUpdatedAt: number | null;

  /** Duration for a still-open interval (no end, no known duration): minutes elapsed since its start, so it doesn't read as a false "00h00m". */
  function liveDuration(interval: DayInterval): number {
    if (interval.durationMinutes !== null) return interval.durationMinutes;
    const [h, m] = interval.start.split(':').map(Number);
    const now = new Date();
    const elapsed = now.getHours() * 60 + now.getMinutes() - (h * 60 + m);
    return elapsed >= 0 ? elapsed : 0;
  }

  /** "27 de julho, 21:47:11"-style absolute timestamp, formatted per the active locale. */
  $: timestamp = lastUpdatedAt
    ? [
        new Intl.DateTimeFormat($locale, { day: 'numeric', month: 'long' }).format(lastUpdatedAt),
        new Intl.DateTimeFormat($locale, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(
          lastUpdatedAt,
        ),
      ].join(', ')
    : '';
</script>

<div class="card">
  <table>
    <thead>
      <tr>
        <th>{$t('popup.classicStartColumn')}</th>
        <th>{$t('popup.classicEndColumn')}</th>
        <th>{$t('popup.classicDurationColumn')}</th>
      </tr>
    </thead>
    <tbody>
      {#each intervals as interval, index (index)}
        {#if interval.kind === 'worked'}
          <tr>
            <td>{interval.start}</td>
            <td>{interval.end ?? '…'}</td>
            <td>{formatDurationHMm(liveDuration(interval))}</td>
          </tr>
        {:else}
          <tr class="pause-row">
            <td colspan="3">{$t('popup.classicPauseLabel', { duration: formatDurationHMm(liveDuration(interval)) })}</td>
          </tr>
        {/if}
      {/each}
    </tbody>
  </table>
</div>

{#if timestamp}
  <p class="timestamp">{timestamp}</p>
{/if}

<div class="stats">
  <div class="stat">
    <span class="value">{minutesToTime(workedMinutes)} h</span>
    <span class="label">{$t('popup.workedLabel')}</span>
  </div>
  <div class="stat">
    <span class="value">{minutesToTime(breakMinutes)} h</span>
    <span class="label">{$t('popup.breakLabel')}</span>
  </div>
</div>

<style>
  .card {
    border-radius: var(--radius-md);
    overflow: hidden;
    box-shadow: var(--shadow-card);
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }

  thead th {
    background: var(--color-classic-band);
    color: var(--color-ink);
    font-weight: 700;
    padding: 8px;
  }

  tbody td {
    background: var(--color-surface-raised);
    text-align: center;
    padding: 8px;
  }

  .pause-row td {
    background: var(--color-classic-band-alt);
    color: var(--color-ink);
    font-weight: 700;
    text-align: center;
  }

  .timestamp {
    text-align: center;
    font-size: 12px;
    font-style: italic;
    color: var(--color-text-muted);
    margin: 10px 0;
  }

  .stats {
    display: flex;
    gap: 8px;
  }

  .stat {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 10px 8px;
    border-radius: var(--radius-sm);
    background: var(--color-classic-stat-bg);
    color: var(--color-classic-stat-text);
  }

  .value {
    font-family: var(--font-mono);
    font-weight: 700;
    font-size: 15px;
  }

  .label {
    font-size: 12px;
  }
</style>
