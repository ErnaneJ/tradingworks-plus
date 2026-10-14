<script lang="ts">
  export let columns: { key: string; label: string }[];
  export let rows: Record<string, string>[];
  export let emptyMessage: string;
</script>

{#if rows.length === 0}
  <p class="empty">{emptyMessage}</p>
{:else}
  <div class="scroll">
    <table>
      <thead>
        <tr>
          {#each columns as column}
            <th>{column.label}</th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each rows as row}
          <tr>
            {#each columns as column}
              <td>{row[column.key] ?? ''}</td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/if}

<style>
  .empty {
    font-size: 13px;
    color: var(--color-text-muted);
  }

  .scroll {
    overflow-x: auto;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }

  th,
  td {
    text-align: left;
    padding: 8px 12px;
    white-space: nowrap;
  }

  thead th {
    background: var(--color-surface);
    color: var(--color-text-muted);
    font-weight: 600;
    border-bottom: 1px solid var(--color-border);
  }

  tbody tr:not(:last-child) td {
    border-bottom: 1px solid var(--color-border);
  }
</style>
