<template>
  <div v-if="cacheDataInfos.length > 0" class="fit column">
    <q-select class="text-subtitle1" bg-color="indigo-2" popup-content-class="text-subtitle1" outlined
      v-model="curCacheIndex" :options="cacheDataOpts" emit-value map-options square dense>
      <template v-slot:prepend>
        <div class="text-subtitle1 text-blue-10 q-ml-sm">Query history :</div>
      </template>
    </q-select>
    <div class="col row q-pa-sm" style="overflow: auto;">
      <q-scroll-area class="full-height col-12 col-lg-7 compMinWidth" :vertical-thumb-style="{ zIndex: '999' }">
        <q-list separator @click="viewRoleDetail">
          <q-expansion-item v-for="(item, i) in Object.entries(curCacheData)" :key="`item-${i}`"
            class="itemExpanded q-mx-sm" :default-opened="i === 0" group="purchaseRec">
            <template v-slot:header>
              <div class="fit">
                <div class="row items-center">
                  <span class="text-h6 text-bold">{{ item[0] }}</span>
                  <q-btn icon="fa-solid fa-chart-column" class="q-ml-md chartBtn" color="primary" size="sm"
                    title="view chart" glossy @click.stop="viewChart(i)" />
                </div>
                <div class="row q-gutter-sm q-mr-md">
                  <div class="col row text-subtitle1" v-for="(itemProp, ipj) in Object.entries(item[1].overview)"
                    :key="`itemRec${ipj}`">
                    <div class="col glossy bg-blue-8 text-white row justify-center items-center">
                      <span>{{ itemProp[0] }}</span>
                    </div>
                    <div class="col glossy bg-blue-2 text-bold row justify-center items-center">
                      <div class="col" style="text-align: center; word-wrap: break-word">
                        {{ itemProp[1] }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </template>

            <q-table class="sticky-header-row" table-header-style="text-align:center" :title="`${item[0]} sale records`"
              :rows="item[1].rows" separator="horizontal" square virtual-scroll :pagination="{ rowsPerPage: 0 }"
              :rows-per-page-options="[0]" :virtual-scroll-sticky-size-start="48" hide-bottom :filter="tableQuery"
              style="max-height: 73vh;">
              <template v-slot:top-right>
                <q-input v-model="tableQuery" type="text" class="q-mr-md" dense debounce="500" placeholder="查詢...">
                  <template v-slot:prepend>
                    <q-icon name="fa-solid fa-magnifying-glass" />
                  </template>
                </q-input>
                <q-btn class="glossy text-subtitle1" color="grey-8" icon="fa-solid fa-download" @click="
                  downloadCsv(
                    `[${cacheDataInfos[curCacheIndex].queryConfig.svr === -1
                      ? 'All' : appConfigs.servers[cacheDataInfos[curCacheIndex].queryConfig.svr]
                    }] ${cacheDataInfos[curCacheIndex].queryConfig.time.from || cacheDataInfos[curCacheIndex].queryConfig.time
                    } ~ ${cacheDataInfos[curCacheIndex].queryConfig.time.to || cacheDataInfos[curCacheIndex].queryConfig.time
                    }  ${item[0]} sale records`,
                    item[1].rows
                  )" push />
              </template>
              <template v-slot:header-cell-Index="props">
                <q-th class="text-center text-uppercase">{{ props.col.name }}</q-th>
              </template>
              <template v-slot:body-cell-Index="props">
                <q-td class="text-center">{{ props.rowIndex + 1 }}</q-td>
              </template>
              <template v-slot:body-cell-Buyer="props">
                <q-td>
                  <span class="purchaser cursor-pointer" style="color:blue;text-decoration:underline;"
                    :data-svr="props.row.Server">
                    {{ props.value }}
                  </span>
                </q-td>
              </template>
            </q-table>
          </q-expansion-item>
        </q-list>
      </q-scroll-area>

      <div class="full-height col-12 col-lg-5 compMinWidth column">
        <q-tabs v-model="curDetail" class="customTabs text-grey bg-light-blue-2 shadow-2 q-mx-sm glossy"
          active-class="text-white bg-blue-6 glossy" indicator-color="transparent" align="justify" dense>
          <q-tab name="purchaseRanking" label="Purchase ranking" />
          <q-tab name="roleDetail" label="Role info" />
        </q-tabs>

        <q-tab-panels v-model="curDetail" animated class="full-width col bg-transparent" keep-alive
          keep-alive-include="roleDetail">
          <q-tab-panel name="purchaseRanking" class="fit" style="border: 1px solid transparent;">
            <ChartComp v-if="operPanel.curFunc === 'ItemPurchase' && curChartConfig !== null"
              :chart-config="curChartConfig" :click-handler="chartClickHandler" />
          </q-tab-panel>

          <q-tab-panel name="roleDetail" class="fit q-pa-none">
            <PlayerInfos v-if="detailExisted" :query-config="detailQueryConfig" :single-block="true"
              :caller="'ItemPurchase'" />
            <div v-else class="fit text-h6 text-bold row justify-center items-center">
              Click buyer in the table or chart xaxis label to check role info
            </div>
          </q-tab-panel>
        </q-tab-panels>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  computed, nextTick, onActivated, ref, watch,
} from 'vue';
import { useQuasar } from 'quasar';
import { useAppConfigsStore } from 'src/stores/AppConfigs';
import { useOperPanelStore } from 'src/stores/OperPanel';
import { useItemPurchaseStore } from 'src/stores/ItemPurchase';
import { downloadCsv } from 'src/utils/common';
import ChartComp from 'src/components/common/ChartComp.vue';
import PlayerInfos from 'src/components/functions/PlayerInfos/PlayerInfos.vue';

const $q = useQuasar();
const appConfigs = useAppConfigsStore();
const operPanel = useOperPanelStore();
const itemPurchase = useItemPurchaseStore();

function getInfoLabel(queryConfig) {
  return `[${appConfigs.servers[queryConfig.svr] || 'All'}] ${queryConfig.name} `
    + `${queryConfig.time.from || queryConfig.time} ~ ${queryConfig.time.to || queryConfig.time}`;
}

const cacheDataInfos = ref([]);
const cacheDataOpts = computed(() => cacheDataInfos.value.map((info, index) => ({
  label: getInfoLabel(info.queryConfig),
  value: index,
})));
const curCacheIndex = ref(0);
const curCacheData = computed(() => cacheDataInfos.value[curCacheIndex.value]?.content || {});
const tableQuery = ref('');
const curChartConfig = ref(null);

const curDetail = ref('purchaseRanking');
const detailExisted = ref(false);
const detailQueryConfig = ref(null);

function viewChart(recIndex) {
  curChartConfig.value = Object.values(curCacheData.value)[recIndex].chartConfig;
}

async function execQueryReq(queryConfig) {
  operPanel.preparing = true;

  const { ipList, data } = await itemPurchase.reqItemPurchaseRecs(queryConfig);
  const queryConfigLabel = getInfoLabel(queryConfig);
  const existedDataIndex = cacheDataOpts.value.findIndex((opt) => opt.label === queryConfigLabel);
  const dataInfo = {
    queryConfig: {
      time: queryConfig.time,
      svr: queryConfig.svr,
      name: queryConfig.name,
    },
    content: data,
  };

  if (dataInfo.content === null) $q.notify('No recoeds about this item');
  else if (dataInfo.content === undefined) $q.notify('Fail to get the purchase record of the item');
  else if (existedDataIndex === -1) {
    cacheDataInfos.value.push(dataInfo);
    if (cacheDataInfos.value.length > appConfigs.queryCacheCount) cacheDataInfos.value.shift();
    curCacheIndex.value = cacheDataInfos.value.length - 1;
  } else {
    cacheDataInfos.value[existedDataIndex] = dataInfo;
    curCacheIndex.value = existedDataIndex;
  }

  operPanel.preparing = false;
  return ipList;
}

async function displayRoleDetail(name, svr) {
  detailQueryConfig.value = {
    svr: svr !== undefined ? svr : cacheDataInfos.value[curCacheIndex.value].queryConfig.svr,
    name,
    time: null,
  };
  detailExisted.value = true;
  curDetail.value = 'roleDetail';
  await nextTick();
  operPanel.reqNewData = 'PlayerInfos';
}

async function viewRoleDetail(event) {
  if (event.target.matches('.purchaser')) {
    displayRoleDetail(event.target.textContent, appConfigs.servers.indexOf(event.target.dataset.svr));
  }
}

function chartClickHandler(_event, _chartContext, cfg) {
  const [svrString, name] = cfg.config.xaxis.categories[cfg.labelIndex].split('-');
  displayRoleDetail(name, appConfigs.servers.findIndex((svr) => svr === svrString));
}

onActivated(() => {
  if (operPanel.delegateQuery === 'ItemPurchase') {
    operPanel.reqNewData = 'ItemPurchase';
    operPanel.delegateQuery = null;
  }
});

watch(() => operPanel.reqNewData, async (v) => {
  if (v === 'ItemPurchase') {
    const ipList = await execQueryReq(operPanel.queryConfig);

    appConfigs.updateIpLocation(Object.keys(ipList))
      .then((ipLoc) => {
        Object.values(curCacheData.value).forEach((itemInfo) => {
          itemInfo.rows.forEach((row) => { row.Location = ipLoc[row.IP]; });
        });
      });

    const data = Object.values(curCacheData.value);
    curChartConfig.value = data.length ? data[0].chartConfig : null;
    operPanel.reqNewData = '';
  }
});

watch(() => operPanel.delegateQuery, () => {
  if (operPanel.delegateQuery === 'ItemPurchase') {
    operPanel.reqNewData = 'ItemPurchase';
    operPanel.delegateQuery = null;
  }
});
</script>
