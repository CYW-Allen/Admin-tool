<template>
  <apexchart height="100%" :options="chartOpts" :series="chartConfig.series" />
</template>

<script setup>
import { computed } from 'vue';
import { date } from 'quasar';
import { getRandomHexColor } from 'src/utils/common';

const { getDateDiff } = date;
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
      return {
        chart: {
          type: 'bar',
          fontFamily: 'Microsoft JhengHei',
          toolbar: { tools: { download: '<i class="fa-solid fa-download fa-lg"></i>' } },
          ...(props.chartConfig.clickEventHandler && {
            events: props.chartConfig.clickEventHandler,
          }),
          ...(props.clickHandler && {
            events: {
              xAxisLabelClick: props.clickHandler,
            },
          }),
        },
        ...(props.chartConfig.title && { title: { text: props.chartConfig.title, align: 'center', style: { fontSize: '18px' } } }),
        colors: props.chartConfig.colors || Array.from(
          { length: props.chartConfig.series[0].data.length },
          () => getRandomHexColor(),
        ),
        plotOptions: {
          bar: {
            distributed: props.chartConfig.isDistributed !== undefined
              ? props.chartConfig.isDistributed : true,
          },
        },
        dataLabels: { enabled: false },
        legend: { show: false },
        xaxis: {
          categories: props.chartConfig.xaxisLabels,
          labels: {
            rotateAlways: true,
            hideOverlappingLabels: false,
            maxHeight: 200,
            style: { fontSize: '16px', fontWeight: 400 },
          },
        },
        yaxis: props.chartConfig.yaxis || {
          labels: {
            style: { fontSize: '16px' },
            formatter: (val) => val.toFixed(0),
          },
        },
      };
    case 'timeBar':
      return {
        chart: {
          type: 'rangeBar',
          fontFamily: 'Microsoft JhengHei',
          toolbar: { tools: { download: '<i class="fa-solid fa-download fa-lg"></i>' } },
        },
        plotOptions: { bar: { horizontal: true } },
        dataLabels: {
          enabled: true,
          formatter(val) {
            let diff = getDateDiff(new Date(val[1]), new Date(val[0]), 'minutes');
            const day = Math.floor(diff / 1440);
            diff -= day * 1440;
            const hour = Math.floor(diff / 60);
            diff -= hour * 60;
            return `${day ? `${day}天` : ''}${hour ? `${hour}小時` : ''}${diff}分鐘`;
          },
        },
        xaxis: {
          type: 'datetime',
          labels: {
            datetimeFormatter: {
              year: 'yyyy年',
              month: 'yyyy年M月',
              day: 'M月d日',
              hour: 'HH:mm',
            },
          },
        },
        yaxis: { show: false },
        grid: { xaxis: { lines: { show: true } } },
        tooltip: { x: { format: 'M月d日 HH:mm' } },
      };
    case 'pie':
      return {
        chart: {
          type: 'pie',
          fontFamily: 'Microsoft JhengHei',
          toolbar: { tools: { download: '<i class="fa-solid fa-download fa-lg"></i>' } },
        },
        title: { text: props.chartConfig.title, align: 'center', style: { fontSize: '18px' } },
        colors: props.chartConfig.colors,
        labels: props.chartConfig.xaxisLabels,
        fill: { type: 'gradient' },
        dataLabels: {
          formatter: (val, opts) => [`${props.chartConfig.xaxisLabels[opts.seriesIndex]} ${Math.round(val)}%`],
          style: { fontSize: '16px', colors: ['#000000', '#000000'] },
          dropShadow: { enabled: false },
        },
        legend: { show: false },
      };
    case 'mixed':
      return {
        chart: {
          type: 'line',
          fontFamily: 'Microsoft JhengHei',
          toolbar: { tools: { download: '<i class="fa-solid fa-download fa-lg"></i>' } },
        },
        ...(props.chartConfig.title && { title: { text: props.chartConfig.title, align: 'center', style: { fontSize: '18px' } } }),
        stroke: {
          curve: 'smooth',
          width: props.chartConfig.strokeWidth || 3,
        },
        colors: props.chartConfig.colors || Array.from({ length: props.chartConfig.series.length }, () => getRandomHexColor()),
        xaxis: {
          type: 'category',
          labels: {
            trim: true, style: { fontSize: '16px' }, hideOverlappingLabels: false, rotate: 0,
          },
          categories: props.chartConfig.xaxisLabels,
          tooltip: { enabled: false },
        },
        yaxis: props.chartConfig.yaxis || { labels: { style: { fontSize: '16px' } } },
      };
    case 'semiDonut':
    default:
      return null;
  }
});
</script>
