<script lang="ts">
  import { t } from '../../lib/i18n';
  import { stateStore } from '../../lib/storage/stores';
  import { minutesToTime } from '../../lib/domain/time';
  import DataTable from '../components/DataTable.svelte';

  $: columns = [
    { key: 'date', label: $t('history.dateColumn') },
    { key: 'balance', label: $t('history.balanceColumn') },
    { key: 'description', label: '' },
  ];

  $: rows = $stateStore.timeBankHistory.map((row) => ({
    date: row.date,
    balance: row.balanceMinutes !== null ? minutesToTime(row.balanceMinutes) : '—',
    description: row.description,
  }));

  $: currentBalance = $stateStore.timeBankMinutes;
</script>

<h1>{$t('history.timeBankTitle')}</h1>

{#if currentBalance !== null}
  <p class="current">
    {$t('popup.timeBankLabel')}: <strong>{minutesToTime(currentBalance)}</strong>
  </p>
{/if}

<DataTable {columns} {rows} emptyMessage={$t('history.emptyState')} />

<style>
  h1 {
    font-size: 20px;
    margin: 0 0 8px;
  }

  .current {
    font-size: 14px;
    color: var(--color-text-muted);
    margin: 0 0 12px;
  }

  .current strong {
    font-family: var(--font-mono);
    color: var(--color-ink);
  }
</style>
