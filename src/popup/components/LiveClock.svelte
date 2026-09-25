<script lang="ts">
  import { onDestroy } from 'svelte';
  import { t } from '../../lib/i18n';

  export let size: 'large' | 'medium' | 'small' = 'large';

  let now = new Date();
  const timer = setInterval(() => {
    now = new Date();
  }, 1000);
  onDestroy(() => clearInterval(timer));

  $: hh = String(now.getHours()).padStart(2, '0');
  $: mm = String(now.getMinutes()).padStart(2, '0');
  $: ss = String(now.getSeconds()).padStart(2, '0');
</script>

<div class="clock" class:medium={size === 'medium'} class:small={size === 'small'} aria-label={$t('popup.currentTimeLabel')}>
  {hh}<span class="sep">:</span>{mm}<span class="seconds">:{ss}</span>
</div>

<style>
  .clock {
    font-family: var(--font-mono);
    font-size: 40px;
    font-weight: 600;
    letter-spacing: -0.02em;
    line-height: 1;
    color: var(--color-ink);
  }

  .clock.medium {
    font-size: 26px;
  }

  .clock.small {
    font-size: 15px;
    font-weight: 500;
  }

  .sep {
    color: var(--color-text-muted);
  }

  .seconds {
    font-size: 20px;
    color: var(--color-text-muted);
    vertical-align: baseline;
  }

  .clock.medium .seconds {
    font-size: 14px;
  }

  .clock.small .seconds {
    font-size: 12px;
  }
</style>
