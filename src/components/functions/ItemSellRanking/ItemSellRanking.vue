<template>
  <div v-if="cacheDataInfos.length > 0" class="fit column">
    <q-select class="text-subtitle1" bg-color="indigo-2" popup-content-class="text-subtitle1" outlined
      v-model="curCacheIndex" :options="cacheDataOpts" emit-value map-options square dense>
      <template v-slot:prepend>
        <div class="text-subtitle1 text-blue-10">Query history :</div>
      </template>
    </q-select>

    <div class="col row" style="overflow: auto;">
      <div class="full-height col compMinWidth q-pa-md" @click="viewRoleDetail">
        <q-table ref="tableEle" class="sticky-header-row" table-header-style="text-align:center"
          :title="curCacheData.tableConfig.title" :rows="curCacheData.tableConfig.rows" separator="horizontal"
          virtual-scroll :pagination="{ rowsPerPage: 0 }" :rows-per-page-options="[0]"
          :virtual-scroll-sticky-size-start="48" hide-bottom :filter="tableQuery" style="max-height: 100%;">
          <template v-slot:top-right>
            <q-input v-model="tableQuery" type="text" class="q-mr-md" dense debounce="500" placeholder="Query...">
              <template v-slot:prepend>
                <q-icon name="fa-solid fa-magnifying-glass" />
              </template>
            </q-input>
            <q-btn class="glossy text-subtitle1" color="grey-8" icon="fa-solid fa-download" @click="downloadCsv(
              fileName, curCacheData.tableConfig.rows)" push />
          </template>
          <template v-slot:header-cell-index="props">
            <q-th class="text-center">{{ props.col.name.toUpperCase() }}</q-th>
          </template>
          <template v-slot:body="props">
            <q-tr :props="props">
              <q-td key="index" :props="props" style="text-align: center;">
                {{ props.rowIndex + 1 }}
              </q-td>
              <q-td key="role" :props="props">
                <span class="seller" style="color: blue;text-decoration: underline;cursor: pointer;">
                  {{ props.row.role }}
                </span>
              </q-td>
              <q-td key="item" :props="props">
                {{ props.row.item }}
              </q-td>
              <q-td key="amount" :props="props">
                {{ props.row.amount }}
              </q-td>
            </q-tr>
          </template>
        </q-table>
      </div>
      <div class="full-height col column compMinWidth q-px-sm">
        <div class="q-pt-md q-px-sm">
          <q-tabs v-model="curDetail" class="customTabs text-grey bg-light-blue-2 shadow-2 glossy"
            active-class="text-white bg-blue-6 glossy" indicator-color="transparent" align="justify" dense>
            <q-tab name="sellRanking" label="Sell Ranking" />
            <q-tab name="roleDetail" label="Role Infos" />
          </q-tabs>
        </div>

        <q-tab-panels v-model="curDetail" animated class="full-width col bg-transparent" keep-alive
          keep-alive-include="roleDetail">
          <q-tab-panel name="sellRanking" class="fit column">
            <q-select v-model="itemChart" :options="Object.keys(curCacheData.chartConfig || {})" bg-color="blue-2"
              popup-content-class="text-subtitle1" filled hide-bottom-space dense>
              <template v-slot:prepend>
                <div class="text-subtitle1 text-blue-10 text-bold ellipsis">Item :</div>
              </template>
              <template v-slot:selected-item="scope">
                <span class="text-subtitle1 ellipsis">{{ scope.opt }}</span>
              </template>
            </q-select>

            <div class="col full-width" style="border: 1px solid transparent;">
              <ChartComp v-if="operPanel.curFunc === 'ItemSellRanking' && itemChart !== null"
                :chart-config="curCacheData.chartConfig[itemChart]" :click-handler="chartClickHandler" />
            </div>
          </q-tab-panel>
          <q-tab-panel name="roleDetail" class="fit q-pa-none">
            <PlayerInfos v-if="detailExisted" :query-config="detailQueryConfig" :single-block="true"
              :caller="'ItemSellRanking'" />
            <div v-else class="fit text-h6 text-bold row justify-center items-center">
              Click role field in the table to check the details
            </div>
          </q-tab-panel>
        </q-tab-panels>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  computed, nextTick, ref, watch,
} from 'vue';
import { useQuasar } from 'quasar';
import { useAppConfigsStore } from 'src/stores/AppConfigs';
import { useOperPanelStore } from 'src/stores/OperPanel';
import { useItemSellRankingStore } from 'src/stores/ItemSellRanking';
import { downloadCsv } from 'src/utils/common';
import ChartComp from 'src/components/common/ChartComp.vue';
import PlayerInfos from '../PlayerInfos/PlayerInfos.vue';

const $q = useQuasar();
const appConfigs = useAppConfigsStore();
const operPanel = useOperPanelStore();
const itemSellRanking = useItemSellRankingStore();

const cacheDataInfos = ref([]);
const cacheDataOpts = computed(() => cacheDataInfos.value.map((info, index) => ({
  label: `[${appConfigs.servers[info.queryConfig.svr]}] ${info.content.periodTimeStr}`,
  value: index,
})));
const curCacheIndex = ref(0);
const curCacheData = computed(() => cacheDataInfos.value[curCacheIndex.value]?.content || {});
const tableQuery = ref('');
const curDetail = ref('sellRanking');
const itemChart = ref(null);
const fileName = computed(() => (
  `${(curCacheData.value?.tableConfig?.title || '')}
  ${(curCacheData.value?.periodTimeStr?.replace(/[/\s]/g, '')?.replace(/:/g, '') || '')}`
));

const detailQueryConfig = ref(null);
const detailExisted = ref(false);

async function displayRoleDetail(name) {
  detailQueryConfig.value = {
    svr: cacheDataInfos.value[curCacheIndex.value].queryConfig.svr,
    name,
    time: null,
  };
  detailExisted.value = true;
  curDetail.value = 'roleDetail';
  await nextTick();
  operPanel.reqNewData = 'PlayerInfos';
}

async function viewRoleDetail(event) {
  if (event.target.matches('.seller')) displayRoleDetail(event.target.textContent);
}

function chartClickHandler(_event, _chartContext, cfg) {
  displayRoleDetail(cfg.config.xaxis.categories[cfg.labelIndex]);
}

async function execQueryReq(queryConfig) {
  operPanel.preparing = true;

  const queryConfigLabel = `[${appConfigs.servers[queryConfig.svr]}] `
    + `${itemSellRanking.getPeriodTimeStr(queryConfig)}`;
  const existedDataIndex = cacheDataOpts.value.findIndex((opt) => opt.label === queryConfigLabel);
  const dataInfo = {
    queryConfig: {
      svr: queryConfig.svr,
      time: queryConfig.time,
    },
    content: await itemSellRanking.reqItemSellRanking(queryConfig),
  };

  if (dataInfo.content === null) $q.notify('There is no selling records during this period');
  else if (dataInfo.content === undefined) $q.notify('Fail to get the selling records');
  else if (existedDataIndex === -1) {
    cacheDataInfos.value.push(dataInfo);
    if (cacheDataInfos.value.length > appConfigs.queryCacheCount) cacheDataInfos.value.shift();
    curCacheIndex.value = cacheDataInfos.value.length - 1;
    [itemChart.value] = Object.keys(curCacheData.value.chartConfig);
  } else {
    cacheDataInfos.value[existedDataIndex] = dataInfo;
    curCacheIndex.value = existedDataIndex;
    [itemChart.value] = Object.keys(curCacheData.value.chartConfig);
  }
  operPanel.preparing = false;
}

watch(() => operPanel.reqNewData, async (v) => {
  if (v === 'ItemSellRanking') {
    await execQueryReq(operPanel.queryConfig);
    operPanel.reqNewData = '';
  }
});

watch(curCacheIndex, () => {
  [itemChart.value] = Object.keys(curCacheData.value.chartConfig);
});
</script>
