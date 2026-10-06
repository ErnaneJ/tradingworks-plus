<script lang="ts">
  import type { TrackedState } from '../../lib/storage/schema';
  import { t } from '../../lib/i18n';
  import StatusPill from '../components/StatusPill.svelte';
  import PunchButton from '../components/PunchButton.svelte';
  import StatRow from '../components/StatRow.svelte';

  export let state: TrackedState;
  export let pending: boolean;
  export let canPunch: boolean;
  export let onPunch: () => void;

  const TALLY_REPORTS: { key: string; labelKey: string }[] = [
    { key: 'overtimeRequisitions', labelKey: 'history.reportOvertimeRequisitions' },
    { key: 'approveManualAttendances', labelKey: 'history.reportApproveManualAttendances' },
    { key: 'wfAllowances', labelKey: 'history.reportWfAllowances' },
  ];

  $: tallies = TALLY_REPORTS.map((report) => ({ ...report, count: state.extraReports[report.key]?.rows.length ?? 0 }));
</script>

<div class="caption">
  <StatusPill status={state.status} />
</div>

{#if state.attendanceAlerts.length > 0}
  <ul class="alerts">
    {#each state.attendanceAlerts as alert (alert.id)}
      <li>
        <span>{alert.label}</span>
        <span class="alert-count">{alert.count}</span>
      </li>
    {/each}
  </ul>
  <hr />
{/if}

<div class="tallies">
  {#each tallies as item (item.key)}
    <div class="tally-card">
      <span class="tally-count">{item.count}</span>
      <span class="tally-label">{$t(item.labelKey)}</span>
    </div>
  {/each}
</div>

<hr />

<StatRow workedMinutes={state.workedMinutes} breakMinutes={state.breakMinutes} timeBankMinutes={state.timeBankMinutes} layout="row" />

{#if canPunch}
  <PunchButton status={state.status} {pending} {onPunch} />
{/if}

<style>
  .caption {
    display: flex;
    justify-content: flex-end;
  }

  hr {
    border: none;
    border-top: 1px solid var(--color-border);
    margin: 0;
  }

  .alerts {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .alerts li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 12px;
    padding: 6px 10px;
    background: var(--color-surface);
    border-radius: var(--radius-sm);
  }

  .alert-count {
    font-family: var(--font-mono);
    font-weight: 600;
    color: var(--color-break);
  }

  .tallies {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }

  .tally-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    background: var(--color-surface-raised);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: 10px 6px;
    text-align: center;
  }

  .tally-count {
    font-family: var(--font-mono);
    font-size: 18px;
    font-weight: 600;
  }

  .tally-label {
    font-size: 11px;
    color: var(--color-text-muted);
  }
</style>
