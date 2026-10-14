<script lang="ts">
  import { t } from '../../lib/i18n';
  import { stateStore } from '../../lib/storage/stores';
  import { dedupeReportColumns, isActionOnlyLabel } from '../lib/reportFormatting';
  import DataTable from '../components/DataTable.svelte';

  /** Team-oriented reports (Reports/Actual.aspx, Payroll/CompTimeList.aspx). */
  const TEAM_REPORT_KEYS = ['actual', 'compTime'] as const;

  $: teamReports = TEAM_REPORT_KEYS.filter((key) => $stateStore.extraReports[key]).map((key) => {
    const report = $stateStore.extraReports[key];
    return {
      key,
      title: $t(`history.report${key.charAt(0).toUpperCase()}${key.slice(1)}`),
      columns: dedupeReportColumns(
        report.headers.filter((header) => !isActionOnlyLabel(header.label)).map((header) => ({ key: header.key, label: header.label })),
      ),
      rows: report.rows,
    };
  });
</script>

{#each teamReports as report (report.key)}
  <h2>{report.title}</h2>
  <DataTable columns={report.columns} rows={report.rows} emptyMessage={$t('history.emptyState')} />
{/each}

<style>
  h2 {
    font-size: 15px;
    margin: 0 0 8px;
  }

  h2:not(:first-child) {
    margin-top: 24px;
  }
</style>
