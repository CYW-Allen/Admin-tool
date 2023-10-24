<template>
  <apexchart height="100%" :options="chartOpts" :series="chartConfig.series" />
</template>

<script setup>
import { computed } from 'vue';
import { getRandomHexColor } from 'src/utils/common';

const props = defineProps({
  chartConfig: {
    type: Object,
    required: true,
  },
  clickHandler: {
    type: Function,
  },
});

const chartOpts = computed(() => {
  const seriesCounts = props.chartConfig.series.length;

  switch (props.chartConfig.type) {
    case 'dashboard':
      return {
        chart: {
          type: 'line',
          fontFamily: 'Microsoft JhengHei',
          toolbar: { tools: { download: '<i class="fa-solid fa-download fa-lg"></i>' } },
        },
        stroke: { curve: 'smooth', width: [3, 3, 0.1] },
        fill: {
          type: ['solid', 'solid', 'gradient'],
          gradient: {
            type: 'vertical',
            inverseColors: false,
            opacityFrom: 0.6,
            opacityTo: 0.1,
            stops: [20, 100, 100],
          },
        },
        xaxis: {
          tickAmount: 6,
          categories: props.chartConfig.xaxisLabels,
          labels: { style: { fontSize: '16px' } },
        },
        yaxis: { labels: { style: { fontSize: '16px' } } },
        colors: props.chartConfig.colors || Array.from({ length: seriesCounts }, () => getRandomHexColor()),
      };
    case 'column':
    case 'timeBar':
    case 'pie':
    case 'mixed':
    case 'semiDonut':
    default:
      return null;
  }
});
</script>
