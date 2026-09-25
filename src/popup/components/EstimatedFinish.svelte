<script lang="ts">
  import { onDestroy } from 'svelte';
  import type { TrackedState } from '../../lib/storage/schema';
  import { t } from '../../lib/i18n';
  import { minutesToTime } from '../../lib/domain/time';
  import { settingsStore } from '../../lib/storage/stores';

  export let workedMinutes: number;
  export let status: TrackedState['status'];

  const DAY_MINUTES = 24 * 60;

  let now = new Date();
  const timer = setInterval(() => {
    now = new Date();
  }, 30_000);
  onDestroy(() => clearInterval(timer));

  $: remainingMinutes = $settingsStore.dailyRequiredWorkMinutes - workedMinutes;

  /** Only meaningful while still short of the goal and actively tracked; once reached or before the day starts, there's nothing to project. */
  $: finishTime = (() => {
    if (status !== 'working' && status !== 'on-break') return null;
    if (remainingMinutes <= 0) return null;
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    return minutesToTime((nowMinutes + remainingMinutes) % DAY_MINUTES);
  })();
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
