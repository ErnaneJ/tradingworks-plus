<script lang="ts">
  import { t } from '../../lib/i18n';
  import { minutesToTime } from '../../lib/domain/time';

  export let workedMinutes: number;
  export let breakMinutes: number;
  export let timeBankMinutes: number | null;
  export let layout: 'row' | 'grid' = 'row';

  $: timeBankLabel = timeBankMinutes === null ? '—' : minutesToTime(timeBankMinutes);
  $: timeBankTone = timeBankMinutes === null ? 'neutral' : timeBankMinutes < 0 ? 'negative' : timeBankMinutes > 0 ? 'positive' : 'neutral';
</script>

<div class="row" class:grid={layout === 'grid'}>
  <div class="stat">
    <span class="value">{minutesToTime(workedMinutes)}</span>
    <span class="label">{$t('popup.workedLabel')}</span>
  </div>
  <div class="stat">
    <span class="value">{minutesToTime(breakMinutes)}</span>
    <span class="label">{$t('popup.breakLabel')}</span>
  </div>
  <div class="stat">
    <span class="value tone-{timeBankTone}">{timeBankLabel}</span>
    <span class="label">{$t('popup.timeBankLabel')}</span>
  </div>
</div>

<style>
  .row {
    display: flex;
    justify-content: space-between;
    gap: 8px;
  }

  .row.grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
  }

  .row.grid .stat {
    background: var(--color-surface-raised);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: 10px 8px;
  }

  .row.grid .value {
    font-size: 18px;
  }

  .stat {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
  }

  .value {
    font-family: var(--font-mono);
    font-size: 17px;
    font-weight: 600;
  }

  .value.tone-negative {
    color: var(--color-danger);
  }

  .value.tone-positive {
    color: var(--color-brand);
  }

  .label {
    font-size: 12px;
    color: var(--color-text-muted);
  }
</style>
