<script lang="ts">
  export let checked: boolean;
  export let onChange: (value: boolean) => void;
</script>

<button
  type="button"
  role="switch"
  aria-checked={checked}
  class="toggle"
  class:on={checked}
  on:click={() => onChange(!checked)}
>
  <span class="knob" />
</button>

<style>
  .toggle {
    width: 40px;
    height: 24px;
    border-radius: 12px;
    border: none;
    background: var(--color-border);
    cursor: pointer;
    padding: 2px;
    display: flex;
    align-items: center;
    transition: background 0.15s ease;
  }

  .toggle.on {
    background: var(--color-brand);
  }

  .knob {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: white;
    box-shadow: var(--shadow-card);
    transition: transform 0.15s ease;
  }

  .toggle.on .knob {
    transform: translateX(16px);
  }
</style>
