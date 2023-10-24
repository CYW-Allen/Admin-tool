<template>
  <q-card class="q-mb-md" square>
    <q-tabs v-model="chartViewerCfg.category" class="customTabs text-grey bg-light-blue-2 glossy"
      active-class="text-white bg-blue-6 glossy" indicator-color="transparent" align="justify" dense>
      <q-tab v-for="category in Object.keys(data)" :key="`tab-${category}`" content-class="cateField" :name="category"
        :label="category" />
    </q-tabs>
    <q-separator />
    <q-tab-panels v-model="chartViewerCfg.category" animated>
      <q-tab-panel name="level" class="row justify-center">
        <div class="text-subtitle1 row justify-center items-center q-mr-md">LevelRange :</div>
        <q-range class="col q-pa-xs" :model-value="levelRange" :min="1" :max="maxLevel" :step="1" color="primary"
          label-always switch-label-side @change="val => { levelRange = val }" dense />
        <ToggleBtn class="q-ml-md q-pa-sm" :eleId="`activeMode-${Date.now()}`" :vals="{ left: 'normal', right: 'active' }"
          :curVal="chartViewerCfg.status" @statusChange="(val) => (chartViewerCfg.status = val)" />
      </q-tab-panel>

      <q-tab-panel name="mall" class="row">
        <q-select class="text-subtitle1 col q-mr-sm" bg-color="blue-2" popup-content-class="text-subtitle1" filled
          v-model="chartViewerCfg.viewItem[chartViewerCfg.category]" :options="viewItemOptions" dense>
          <template v-slot:prepend>
            <div class="text-subtitle1 text-blue-10">Kind :</div>
          </template>
        </q-select>
        <q-select v-if="chartViewerCfg.viewItem.mall === 'ranking_player'" class="text-subtitle1 col q-mr-sm"
          bg-color="amber-3" popup-content-class="text-subtitle1" filled v-model="chartViewerCfg.viewSubItem"
          :options="subItemOptions" dense>
        </q-select>
        <q-btn v-if="chartViewerCfg.viewItem.mall !== 'overview'" dense push class="glossy text-subtitle1" color="green"
          icon="fa-solid fa-table" @click="displayChartTable()" />
      </q-tab-panel>

      <q-tab-panel name="online" class="row">
        <q-select class="text-subtitle1 col q-mr-sm" bg-color="blue-2" popup-content-class="text-subtitle1" filled
          v-model="chartViewerCfg.viewItem[chartViewerCfg.category]" :options="viewItemOptions" dense>
          <template v-slot:prepend>
            <div class="text-subtitle1 text-blue-10">Date :</div>
          </template>
        </q-select>
        <q-btn class="text-subtitle1" color="green" icon="fa-solid fa-table" glossy dense push
          @click="displayChartTable()" />
      </q-tab-panel>
    </q-tab-panels>
  </q-card>

  <div v-if="chartViewerCfg.category === 'level'" class="col row">
    <div class="col-6" style="height: 50%;">
      <ChartComp v-if="operPanelStore.curFunc === 'SvrStat'" :chart-config="chartConfig.players" />
    </div>
    <div class="col-6" style="height: 50%;">
      <ChartComp v-if="operPanelStore.curFunc === 'SvrStat'" :chart-config="chartConfig.gold" />
    </div>
    <div class="col-6" style="height: 50%;">
      <ChartComp v-if="operPanelStore.curFunc === 'SvrStat'" :chart-config="chartConfig.dalant" />
    </div>
    <div class="col-6 row justify-center items-center" style="height: 50%;">
      <q-table class="customTable" style="width: 100%;" :title="chartConfig.tableCfg.title"
        :columns="chartConfig.tableCfg.colCfg" separator="cell" :rows="chartConfig.tableCfg.rowData"
        hide-bottom></q-table>
    </div>
  </div>

  <div v-else-if="chartViewerCfg.category === 'mall' && chartViewerCfg.viewItem.mall === 'overview'"
    class="full-width col row justify-between items-start">
    <q-table v-for="([type, rows], i) in Object.entries(data.mall.overview)" :key="i"
      :class="`col customTable ${i === 1 ? '' : 'q-mr-md'}`" :title="type" table-header-class="tabHeader"
      :columns="mallTableCol" :rows="rows" :pagination="{ rowsPerPage: 0 }" :rows-per-page-options="[0]" hide-header
      hide-bottom />
  </div>

  <div v-else-if="chartViewerCfg.category === 'online'" class="col" style="border: 1px solid transparent;">
    <ChartComp v-if="operPanelStore.curFunc === 'SvrStat'" :chart-config="chartConfig.chartOpts" />
  </div>

  <div v-else class="col" style="border: 1px solid transparent;">
    <ChartComp v-if="operPanelStore.curFunc === 'SvrStat'" :chart-config="chartConfig.chartOpts" />
  </div>
</template>

<script setup>
import {
  ref, computed, reactive,
} from 'vue';
import { useOperPanelStore } from 'src/stores/OperPanel';
import { useSvrStatStore } from 'src/stores/SvrStat';
import ToggleBtn from 'src/components/common/ToggleBtn.vue';
import ChartComp from 'src/components/common/ChartComp.vue';

const props = defineProps({
  queryConfig: {
    type: Object,
    required: true,
  },
  data: {
    type: Object,
    required: true,
  },
});
const operPanelStore = useOperPanelStore();
const svrStatStore = useSvrStatStore();

const chartViewerCfg = reactive({
  category: 'level',
  status: 'normal',
  viewItem: {
    mall: 'overview',
    online: Object.keys(props.data.online)[0],
  },
  viewSubItem: null,
});
const maxLevel = computed(() => props.data.level.normal.players.length - 1);
const levelRange = ref({ min: 1, max: maxLevel.value });
const viewItemOptions = computed(() => Object.keys(props.data[chartViewerCfg.category]));
const subItemOptions = computed(() => {
  const options = Object.keys(props.data.mall.ranking_player);
  [chartViewerCfg.viewSubItem] = options;
  return options;
});

const chartConfig = computed(() => {
  const output = {
    tableCfg: {
      title: '',
      colCfg: '',
      rowData: '',
      queryConfig: { ...props.queryConfig },
    },
  };

  switch (chartViewerCfg.category) {
    case 'level':
      svrStatStore.fillLevelChartCfg(
        output,
        props.data.level[chartViewerCfg.status],
        levelRange.value,
      );
      break;
    case 'mall':
      if (chartViewerCfg.viewItem.mall !== 'overview') {
        svrStatStore.fillMallChartCfg(
          output,
          chartViewerCfg.viewItem.mall,
          props.data.mall,
          chartViewerCfg,
          subItemOptions.value,
        );

        svrStatStore.fillMallTableCfg(
          output,
          props.data.mall,
          chartViewerCfg,
          subItemOptions.value,
        );
      }
      break;
    case 'online':
      svrStatStore.fillOnlineChartCfg(output, props.data.online[chartViewerCfg.viewItem.online]);
      svrStatStore.fillOnlineTableCfg(output, props.data.online, chartViewerCfg);
      break;
    default:
  }
  return output;
});

const mallTableCol = [
  {
    name: 'Property',
    label: 'Property',
    field: (row) => row.Property,
    align: 'center',
    sortable: false,
    style: 'font-size: 16px;',
    required: true,
  },
  {
    name: 'Value',
    label: 'Value',
    field: (row) => row.Value,
    align: 'center',
    sortable: false,
    style: 'font-size: 16px;',
    required: true,
  },
];

function displayChartTable() {
  operPanelStore.tableConfig = chartConfig.value.tableCfg;
  operPanelStore.tableDlgShow = true;
}
</script>
