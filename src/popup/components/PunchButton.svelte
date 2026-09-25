<script lang="ts">
  import { t } from '../../lib/i18n';
  import type { WorkStatus } from '../../lib/storage/schema';

  export let status: WorkStatus;
  export let pending: boolean;
  export let onPunch: () => void;
  export let compact = false;

  $: label = pending ? $t('popup.punching') : status === 'working' ? $t('popup.clockOut') : $t('popup.clockIn');
  $: isClockOut = status === 'working';
</script>

<button class="punch" class:out={isClockOut} class:compact disabled={pending} on:click={onPunch}>
  {label}
</button>

<style>
  .punch {
    width: 100%;
    padding: 14px 16px;
    border: none;
    border-radius: var(--radius-md);
    background: var(--color-brand);
    color: white;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.1s ease, opacity 0.15s ease;
  }

  .punch:hover:not(:disabled) {
    transform: translateY(-1px);
  }

  .punch:disabled {
    opacity: 0.6;
    cursor: default;
  }

  .punch.out {
    background: var(--color-ink);
    color: var(--color-surface);
  }

  .punch.compact {
    width: auto;
    padding: 8px 16px;
    font-size: 13px;
    border-radius: var(--radius-sm);
    flex-shrink: 0;
  }
</style>
