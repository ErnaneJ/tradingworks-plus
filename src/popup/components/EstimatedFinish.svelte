<script lang="ts">
  import type { TrackedState } from '../../lib/storage/schema';
  import { t } from '../../lib/i18n';
  import { minutesToTime } from '../../lib/domain/time';
  import { settingsStore } from '../../lib/storage/stores';

  export let workedMinutes: number;
  export let status: TrackedState['status'];
  export let lastUpdatedAt: number | null;

  const DAY_MINUTES = 24 * 60;

  $: remainingMinutes = $settingsStore.dailyRequiredWorkMinutes - workedMinutes;

  /**
   * Anchored to `lastUpdatedAt` (the moment `workedMinutes` was last computed), not the live
   * clock: `workedMinutes` only changes when a background poll runs, so ticking this against
   * the real clock in between polls made the projected finish time drift later every render
   * even though nothing about the actual work day had changed.
   */
  $: anchorMinutes = (() => {
    const anchor = new Date(lastUpdatedAt || Date.now());
    return anchor.getHours() * 60 + anchor.getMinutes();
  })();

  /** Only meaningful while still short of the goal and actively tracked; once reached or before the day starts, there's nothing to project. */
  $: finishTime = status !== 'working' && status !== 'on-break' ? null : remainingMinutes <= 0 ? null : minutesToTime((anchorMinutes + remainingMinutes) % DAY_MINUTES);
</script>

{#if finishTime}
  <p class="estimate">{$t('popup.estimatedFinishLabel', { time: finishTime })}</p>
{/if}

<style>
  .estimate {
    font-size: 12px;
    color: var(--color-text-muted);
    margin: 0;
    text-align: center;
  }
</style>
