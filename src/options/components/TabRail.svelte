<script lang="ts">
  export let tabs: { id: string; label: string }[];
  export let active: string;
  export let onSelect: (id: string) => void;
</script>

<nav class="rail">
  {#each tabs as tab}
    <button class="tab" class:active={tab.id === active} on:click={() => onSelect(tab.id)}>
      {tab.label}
    </button>
  {/each}
</nav>

<style>
  .rail {
    display: flex;
    flex-direction: column;
    gap: 2px;
    width: 220px;
    flex-shrink: 0;
  }

  .tab {
    text-align: left;
    border: none;
    background: none;
    padding: 10px 12px;
    border-radius: var(--radius-sm);
    font-size: 14px;
    color: var(--color-text-muted);
    cursor: pointer;
    white-space: nowrap;
  }

  .tab:hover {
    background: var(--color-surface-raised);
  }

  .tab.active {
    background: var(--color-surface-raised);
    color: var(--color-ink);
    font-weight: 600;
    box-shadow: var(--shadow-card);
  }
</style>
