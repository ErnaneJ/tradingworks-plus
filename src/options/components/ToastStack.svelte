<script lang="ts">
  import { fly, fade } from 'svelte/transition';
  import { toasts } from '../lib/toast';
</script>

<div class="stack">
  {#each $toasts as item (item.id)}
    <div class="toast {item.variant}" in:fly={{ y: 12, duration: 200 }} out:fade={{ duration: 150 }}>
      {item.message}
    </div>
  {/each}
</div>

<style>
  .stack {
    position: fixed;
    right: 24px;
    bottom: 24px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    z-index: 1000;
    pointer-events: none;
  }

  .toast {
    font-size: 13px;
    font-weight: 600;
    padding: 10px 16px;
    border-radius: var(--radius-sm);
    box-shadow: var(--shadow-card);
    color: #ffffff;
  }

  .toast.success {
    background: var(--color-brand);
  }

  .toast.error {
    background: var(--color-danger);
  }
</style>
