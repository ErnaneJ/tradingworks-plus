<script lang="ts">
  export let label: string;
  export let hint = '';
</script>

<div class="field">
  <div class="text">
    <span class="label">{label}</span>
    {#if hint}<span class="hint">{hint}</span>{/if}
  </div>
  <div class="control">
    <slot />
  </div>
</div>

<style>
  .field {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    padding: 14px 0;
    border-bottom: 1px solid var(--color-border);
  }

  .text {
    display: flex;
    flex-direction: column;
    gap: 3px;
    max-width: 420px;
  }

  .label {
    font-size: 14px;
    font-weight: 600;
  }

  .hint {
    font-size: 12px;
    color: var(--color-text-muted);
  }

  .control {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 8px;
  }
</style>
