<script lang="ts">
  import type { WorkStatus } from '../../lib/storage/schema';
  import { statusColor, statusTranslationKey } from '../statusColors';
  import { t } from '../../lib/i18n';

  export let status: WorkStatus;
</script>

<span class="pill" style:--dot={statusColor(status)}>
  <span class="dot" />
  {$t(statusTranslationKey(status))}
</span>

<style>
  .pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 500;
    color: var(--color-text-muted);
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--dot);
  }
</style>
