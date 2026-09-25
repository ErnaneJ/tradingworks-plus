<script lang="ts">
  import { t } from '../../lib/i18n';
  import { stateStore } from '../../lib/storage/stores';
  import { minutesToTime } from '../../lib/domain/time';
  import { dedupeReportColumns, isActionOnlyLabel } from '../lib/reportFormatting';
  import DataTable from '../components/DataTable.svelte';

  $: columns = [
    { key: 'date', label: $t('history.dateColumn') },
    { key: 'entries', label: $t('history.entriesColumn') },
    { key: 'worked', label: $t('history.workedColumn') },
    { key: 'balance', label: $t('history.balanceColumn') },
  ];

  $: rows = $stateStore.attendanceHistory.map((row) => ({
    date: row.date,
    entries: row.entries.join(', '),
    worked: row.workedMinutes !== null ? minutesToTime(row.workedMinutes) : '—',
    balance: row.balanceMinutes !== null ? minutesToTime(row.balanceMinutes) : '—',
  }));

  $: extraReports = Object.entries($stateStore.extraReports).map(([key, report]) => ({
    key,
    title: $t(`history.report${key.charAt(0).toUpperCase()}${key.slice(1)}`),
    columns: dedupeReportColumns(
      report.headers.filter((header) => !isActionOnlyLabel(header.label)).map((header) => ({ key: header.key, label: header.label })),
    ),
    rows: report.rows,
  }));
</script>

<h1>{$t('history.attendanceTitle')}</h1>
<DataTable {columns} {rows} emptyMessage={$t('history.emptyState')} />

{#each extraReports as report (report.key)}
  <h2>{report.title}</h2>
  <DataTable columns={report.columns} rows={report.rows} emptyMessage={$t('history.emptyState')} />
{/each}

<style>
  h1 {
    font-size: 20px;
    margin: 0 0 12px;
  }

  h2 {
    font-size: 15px;
    margin: 24px 0 8px;
  }
</style>
