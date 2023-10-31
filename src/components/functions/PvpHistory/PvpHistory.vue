<template>
  <div v-if="cacheDataInfos.length > 0" class="fit column">
    <q-select class="text-subtitle1" bg-color="indigo-2" popup-content-class="text-subtitle1" outlined
      v-model="curCacheIndex" :options="cacheDataOpts" emit-value map-options square dense>
      <template v-slot:prepend>
        <div class="text-subtitle1 text-blue-10">Query history :</div>
      </template>
    </q-select>

    <q-field bg-color="orange-2" filled dense>
      <template v-slot:control>
        <div class="fit row justify-around items-center text-h6 text-bold">
          <span class="col-auto text-indigo">{{ curCacheData.info.name }}</span>
          <span class="col-auto">{{ `Race: ${curCacheData.info.race}` }}</span>
          <span class="col-auto">{{ `Lv: ${curCacheData.info.lv}` }}</span>
          <span class="col-auto">
            Kill times:
            <span class="text-green-8">{{ curCacheData.info.killTimes }}</span>
          </span>
          <span class="col-auto">
            Kill players:
            <span class="text-green-8">{{ curCacheData.info.victimCounts }}</span>
          </span>
          <span class="col-auto">
            Death times:
            <span class="text-red">{{ curCacheData.info.murderedTimes }}</span>
          </span>
          <span class="col-auto">
            Murderers:
            <span class="text-red">{{ curCacheData.info.murdererCounts }}</span>
          </span>
        </div>
      </template>
    </q-field>

    <q-tabs v-model="curHistory" class="customTabs text-grey bg-light-blue-2 shadow-2 glossy"
      active-class="text-white bg-blue-6 glossy" indicator-color="transparent" align="justify" dense>
      <q-tab v-for="(type, i) in historyType" :key="`tab-${i}`" :name="type" :label="type"></q-tab>
    </q-tabs>

    <q-tab-panels v-model="curHistory" animated class="col bg-transparent">
      <q-tab-panel v-for="(type, i) in historyType" :key="`panel-${i}`" :name="type" class="fit row"
        style="overflow: auto;">
        <div class="full-height col compMinWidth" @click="tableClickHandler">
          <q-table class="sticky-header-row" table-header-style="text-align:center" :title="curCacheData.tableTitle[type]"
            :rows="curCacheData.recs[type]" separator="horizontal" square virtual-scroll :pagination="{ rowsPerPage: 0 }"
            :rows-per-page-options="[0]" :virtual-scroll-sticky-size-start="48" hide-bottom :filter="tableQuery"
            style="max-height: 100%;">
            <template v-slot:top-right>
              <q-input v-model="tableQuery" type="text" class="q-mr-md" dense debounce="500" placeholder="Query...">
                <template v-slot:prepend>
                  <q-icon name="fa-solid fa-magnifying-glass" />
                </template>
              </q-input>
              <q-btn class="glossy text-subtitle1" color="grey-8" icon="fa-solid fa-download"
                @click="downloadCsv(curCacheData.tableTitle[type], curCacheData.recs[type])" push />
            </template>
            <template v-slot:header-cell-index="props">
              <q-th class="text-center">{{ props.col.name.toUpperCase() }}</q-th>
            </template>
            <template v-slot:body-cell-index="props">
              <q-td class="text-center">{{ props.rowIndex + 1 }}</q-td>
            </template>
            <template v-slot:body-cell-role="props">
              <q-td>
                <span class="role cursor-pointer" style="color:blue;text-decoration: underline;">
                  {{ props.value }}
                </span>
              </q-td>
            </template>
          </q-table>
        </div>

        <div class="full-height col compMinWidth column q-pa-none">
          <div class="q-px-sm">
            <q-tabs v-model="curDetail" class="customTabs text-grey bg-light-blue-2 shadow-2 glossy"
              active-class="text-white bg-blue-6 glossy" indicator-color="transparent" align="justify" dense>
              <q-tab name="pvpRanking" label="PVP ranking" />
              <q-tab name="roleDetail" label="Role infos" />
            </q-tabs>
          </div>

          <q-tab-panels v-model="curDetail" animated class="full-width col bg-transparent" keep-alive
            keep-alive-include="roleDetail">
            <q-tab-panel name="pvpRanking" class="fit" style="border: 1px solid transparent;">
              <ChartComp v-if="operPanel.curFunc === 'PvpHistory'" :chart-config="curCacheData.chartConfig[type]"
                :click-handler="chartClickHandler" />
            </q-tab-panel>
            <q-tab-panel name="roleDetail" class="fit row q-pa-none">
              <PlayerInfos v-if="detailExisted" :query-config="detailQueryConfig" :single-block="true"
                :caller="'PvpHistory'" />
              <div v-else class="fit text-h6 text-bold row justify-center items-center">
                Click role name in table to check the role infos
              </div>
            </q-tab-panel>
          </q-tab-panels>
        </div>
      </q-tab-panel>
    </q-tab-panels>
  </div>
</template>

<script setup>
import {
  computed, nextTick, ref, watch,
} from 'vue';
import { useQuasar } from 'quasar';
import { useAppConfigsStore } from 'src/stores/AppConfigs';
import { useOperPanelStore } from 'src/stores/OperPanel';
import { usePvpHistoryStore } from 'src/stores/PvpHistory';
import { downloadCsv } from 'src/utils/common';
import ChartComp from 'src/components/common/ChartComp.vue';
import PlayerInfos from 'src/components/functions/PlayerInfos/PlayerInfos.vue';

const $q = useQuasar();
const appConfigs = useAppConfigsStore();
const operPanel = useOperPanelStore();
const pvpHistory = usePvpHistoryStore();

function getInfoLabel(queryConfig) {
  return `[${appConfigs.servers[queryConfig.svr]}] ${queryConfig.time} ${queryConfig.name}`;
}

const cacheDataInfos = ref([]);
const cacheDataOpts = computed(() => cacheDataInfos.value.map((info, index) => ({
  label: getInfoLabel(info.queryConfig),
  value: index,
})));
const curCacheIndex = ref(0);
const curCacheData = computed(() => cacheDataInfos.value[curCacheIndex.value]?.content || {});

const historyType = computed(() => (
  Object.entries(curCacheData.value?.recs || {})
    .filter(([, recs]) => recs.length !== 0)
    .map(([type]) => type)
));
const curHistory = ref('');
const tableQuery = ref('');

const curDetail = ref('pvpRanking');
const detailExisted = ref(false);
const detailQueryConfig = ref(null);

async function execQueryReq(queryConfig) {
  operPanel.preparing = true;
  const queryConfigLabel = getInfoLabel(queryConfig);
  const existedDataIndex = cacheDataOpts.value.findIndex((opt) => opt.label === queryConfigLabel);
  const dataInfo = {
    queryConfig: { ...queryConfig },
    content: await pvpHistory.reqPvpHistory(queryConfig),
  };

  if (dataInfo.content === null) $q.notify('There is no pvp records of this role');
  else if (dataInfo.content === undefined) $q.notify('Fail to get pvp records');
  else if (existedDataIndex === -1) {
    cacheDataInfos.value.push(dataInfo);
    if (cacheDataInfos.value.length > appConfigs.queryCacheCount) cacheDataInfos.value.shift();
    curCacheIndex.value = cacheDataInfos.value.length - 1;
  } else {
    cacheDataInfos.value[existedDataIndex] = dataInfo;
    curCacheIndex.value = existedDataIndex;
  }
  operPanel.preparing = false;
}

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

function tableClickHandler(event) {
  if (event.target.matches('.role')) displayRoleDetail(event.target.textContent);
}

function chartClickHandler(_event, _chartContext, cfg) {
  displayRoleDetail(cfg.config.xaxis.categories[cfg.labelIndex]);
}

watch(() => operPanel.reqNewData, async (v) => {
  if (v === 'PvpHistory') {
    await execQueryReq(operPanel.queryConfig);
    [curHistory.value] = historyType.value;
    operPanel.reqNewData = '';
  }
});

watch(curCacheIndex, () => {
  [curHistory.value] = historyType.value;
});

watch(curHistory, () => {
  detailExisted.value = false;
});
</script>
