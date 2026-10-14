<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import {
    Chart,
    BarController,
    BarElement,
    CategoryScale,
    LinearScale,
    Tooltip,
    type ChartConfiguration,
    type Plugin,
  } from 'chart.js';
  import { settingsStore } from '../../lib/storage/stores';

  function tokenColor(name: string): string {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  /** Draws each bar's formatted value above it, so magnitude reads at a glance instead of only on hover. */
  const valueLabelsPlugin: Plugin<'bar'> = {
    id: 'valueLabels',
    afterDatasetsDraw(chart) {
      const labels = (chart.options.plugins as Record<string, { labels?: string[] } | undefined>).valueLabels
        ?.labels;
      if (!labels) return;
      const meta = chart.getDatasetMeta(0);
      const values = chart.data.datasets[0]?.data as (number | null)[] | undefined;
      const { ctx } = chart;
      ctx.save();
      ctx.font = "600 10px 'IBM Plex Sans', sans-serif";
      ctx.fillStyle = tokenColor('--color-text-muted');
      ctx.textAlign = 'center';
      meta.data.forEach((bar, index) => {
        const label = labels[index];
        if (!label) return;
        // Negative bars grow downward from the baseline, so bar.y is their bottom edge — draw the label below it instead of above, or it lands inside the bar.
        const isNegative = (values?.[index] ?? 0) < 0;
        ctx.textBaseline = isNegative ? 'top' : 'alphabetic';
        const y = isNegative ? bar.y + 6 : bar.y - 6;
        ctx.fillText(label, bar.x, y);
      });
      ctx.restore();
    },
  };

  /** Draws a dashed reference line (the daily goal, or 0 for a balance chart) so bars read against a real benchmark instead of floating with no scale. */
  const goalLinePlugin: Plugin<'bar'> = {
    id: 'goalLine',
    afterDatasetsDraw(chart) {
      const value = (chart.options.plugins as Record<string, { value?: number | null } | undefined>).goalLine
        ?.value;
      if (value === undefined || value === null) return;
      const { ctx, chartArea, scales } = chart;
      const y = scales.y.getPixelForValue(value);
      ctx.save();
      ctx.strokeStyle = tokenColor('--color-border');
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(chartArea.left, y);
      ctx.lineTo(chartArea.right, y);
      ctx.stroke();
      ctx.restore();
    },
  };

  Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, valueLabelsPlugin, goalLinePlugin);

  export let points: { label: string; value: number; tone?: 'positive' | 'negative' | 'neutral' }[];
  export let formatValue: (value: number) => string;
  /** Optional reference line drawn across the chart — e.g. the daily work goal, or 0 for a balance chart. */
  export let goalValue: number | null = null;

  let canvasEl: HTMLCanvasElement;
  let chart: Chart<'bar'>;

  function toneColor(tone: 'positive' | 'negative' | 'neutral' | undefined): string {
    if (tone === 'positive') return tokenColor('--color-brand');
    if (tone === 'negative') return tokenColor('--color-danger');
    return tokenColor('--color-working');
  }

  function buildConfig(): ChartConfiguration<'bar'> {
    const options = {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 150 },
      layout: { padding: { top: 18 } },
      scales: {
        x: {
          grid: { display: false },
          border: { color: tokenColor('--color-border') },
          ticks: { color: tokenColor('--color-text-muted'), font: { size: 11 } },
        },
        y: {
          display: false,
          beginAtZero: true,
        },
      },
      plugins: {
        legend: { display: false },
        valueLabels: { labels: points.map((point) => formatValue(point.value)) },
        goalLine: { value: goalValue },
        tooltip: {
          backgroundColor: tokenColor('--color-tooltip-bg'),
          titleColor: tokenColor('--color-tooltip-text'),
          bodyColor: tokenColor('--color-tooltip-text'),
          padding: 8,
          cornerRadius: 4,
          displayColors: false,
          callbacks: {
            label: (context: { parsed: { y?: number } }) => formatValue(context.parsed.y ?? 0),
          },
        },
      },
    };

    return {
      type: 'bar',
      data: {
        labels: points.map((point) => point.label),
        datasets: [
          {
            data: points.map((point) => point.value),
            backgroundColor: points.map((point) => toneColor(point.tone)),
            borderRadius: 3,
            maxBarThickness: 32,
          },
        ],
      },
      options,
    } as unknown as ChartConfiguration<'bar'>;
  }

  function render() {
    if (!chart) return;
    const config = buildConfig();
    chart.data = config.data;
    chart.options = config.options ?? {};
    chart.update();
  }

  onMount(() => {
    chart = new Chart(canvasEl, buildConfig());
  });

  onDestroy(() => {
    chart?.destroy();
  });

  $: points, formatValue, goalValue, render();
  $: $settingsStore.theme, render();
</script>

<div class="chart">
  <canvas bind:this={canvasEl} />
</div>

<style>
  .chart {
    position: relative;
    height: 140px;
    margin-top: 12px;
  }
</style>
