<template>
  <div v-if="cacheDataInfos.length > 0" class="fit column">
    <div>
      <q-select class="text-subtitle1" bg-color="indigo-2" popup-content-class="text-subtitle1" outlined
        v-model="curCacheIndex" :options="cacheDataOpts" emit-value map-options square dense>
        <template v-slot:prepend>
          <div class="text-subtitle1 text-blue-10">Query history :</div>
        </template>
      </q-select>

      <q-tabs v-model="curPeriod" class="customTabs text-grey bg-light-blue-2 shadow-2 glossy"
        active-class="text-white bg-blue-6 glossy" indicator-color="transparent" align="justify" dense>
        <q-tab v-for="(p, i) in periods" :key="`tab-${i}`" :name="p" :label="p"></q-tab>
      </q-tabs>

      <div class="row wrap">
        <div class="col bg-blue-2 compMinWidth">
          <div class="row no-wrap justify-center items-center q-pa-sm">
            <div class="text-h6 text-indigo-10 text-bold q-mx-md">Number of participants</div>
            <div>
              <span v-for="([race, counts], pi) in curPeriodParticipants" :key="`participants-${pi}`"
                :class="`text-h6 text-bold q-mr-md`" :style="`color: ${appConfigs.racesColor[race]}`">
                {{ `P-${race}: ${counts}` }}
              </span>
            </div>
          </div>
        </div>
        <div class="col bg-amber-2 compMinWidth">
          <div class="row no-wrap justify-center items-center q-pa-sm">
            <div class="text-h6 text-indigo-10 text-bold  q-mx-md">View chart</div>
            <q-btn-toggle glossy dense toggle-color="primary" v-model="curChartType" :options="[
              { label: 'Chip', value: 'chip' },
              { label: 'PVP', value: 'pvp' }
            ]" />
          </div>
        </div>
        <div class="col bg-green-2 compMinWidth">
          <div class="row no-wrap justify-center items-center q-pa-sm">
            <div class="text-h6 text-indigo-10 text-bold  q-mx-md">View table</div>
            <q-btn-group glossy>
              <q-btn v-for="chip in damageChips" :key="`history${chip}`" class=" text-white text-subtitle2"
                :style="`background: ${appConfigs.racesColor[chip]}`" :label="`C-${chip}`" dense
                @click="viewChipHist(chip)" />
            </q-btn-group>
          </div>
        </div>
      </div>
    </div>

    <q-tab-panels v-model="curPeriod" animated class="col bg-transparent q-pa-none">
      <q-tab-panel v-for="(p, i) in periods" :key="i" :name="p" class="fit"
        style="border: 1px solid transparent; padding: 0;">
        <q-tab-panels v-model="curChartType" class="fit bg-transparent" animated style="overflow: auto;">
          <q-tab-panel name="chip" class="fit row" style="border: 1px solid transparent;">
            <div v-for="chip in damageChips" :key="`chipField${chip}`" class="full-height col column compMinWidth">
              <div class="col-4">
                <div class="full-height row">
                  <div class="col full-height">
                    <ChartComp v-if="operPanel.curFunc === 'ChipWar' && curPeriod === p"
                      :chart-config="curCacheData.chartConfig.damage[p][chip]" :updateTrigger="updateTrigger" />
                  </div>
                  <div class="col full-height">
                    <ChartComp v-if="operPanel.curFunc === 'ChipWar' && curPeriod === p"
                      :chart-config="curCacheData.chartConfig.playerCount[p][chip]" :updateTrigger="updateTrigger" />
                  </div>
                </div>
              </div>
              <div class="col-8 column">
                <ChartComp v-if="operPanel.curFunc === 'ChipWar' && curPeriod === p"
                  :chart-config="curCacheData.chartConfig.chipDmgRanking[p][chip]" :click-handler="chartClickHandler" />
              </div>
            </div>
          </q-tab-panel>

          <q-tab-panel name="pvp" class="" style="border: 1px solid transparent;">
            <div class="fit row q-col-gutter-sm">
              <div class="col compMinWidth" @click="tableClickHandler">
                <q-table ref="tableEle" class="sticky-header-row" :title="curCacheData.tableConfig.pvpRanking[p].title"
                  :columns="curCacheData.tableConfig.pvpRanking[p].colCfg"
                  :rows="curCacheData.tableConfig.pvpRanking[p].rowData" separator="vertical" virtual-scroll
                  :pagination="{ rowsPerPage: 0 }" :rows-per-page-options="[0]" :virtual-scroll-sticky-size-start="48"
                  table-header-class="tableCol" hide-bottom :filter="queryStr" :sort-method="sortPvpRecsTable" square>
                  <template v-slot:top-right>
                    <q-input dense debounce="500" v-model="queryStr" placeholder="Query...">
                      <template v-slot:prepend>
                        <q-icon name="fa-solid fa-magnifying-glass" />
                      </template>
                    </q-input>
                    <q-btn class="glossy text-subtitle1" color="grey-8" icon="fa-solid fa-download"
                      @click="downloadCsv(curCacheData.tableConfig.pvpRanking[p].title, curCacheData.tableConfig.pvpRanking[p].rowData)"
                      push />
                  </template>
                  <template v-slot:body-cell-index="props">
                    <q-td class="text-center">{{ props.rowIndex + 1 }}</q-td>
                  </template>
                  <template v-slot:body-cell-role="props">
                    <q-td
                      :class="`pvpRole text-center cursor-pointer ${curDetailRole === props.value ? 'bg-amber-3' : ''}`"
                      style="color: blue;text-decoration: underline;">
                      {{ props.value }}
                    </q-td>
                  </template>
                </q-table>
              </div>

              <div class="full-height col column compMinWidth">
                <q-tabs v-model="curDetail" class="customTabs q-mx-sm text-grey bg-light-blue-2 shadow-2 glossy"
                  active-class="text-white bg-blue-6 glossy" indicator-color="transparent" align="justify" dense>
                  <q-tab name="pvpRanking" label="PVP statistic" />
                  <q-tab name="roleDetail" label="Role infos" />
                </q-tabs>

                <q-tab-panels v-model="curDetail" animated class="full-width col bg-transparent" keep-alive
                  keep-alive-include="roleDetail">
                  <q-tab-panel name="pvpRanking" class="fit" style="border: 1px solid transparent;">
                    <ChartComp v-if="operPanel.curFunc === 'ChipWar' && curPeriod === p"
                      :chart-config="curCacheData.chartConfig.pvpRanking[p]" :click-handler="chartClickHandler" />
                  </q-tab-panel>

                  <q-tab-panel name="roleDetail" class="fit q-pa-none">
                    <PlayerInfos v-if="detailExisted" :query-config="detailQueryConfig" :single-block="true"
                      :caller="'ChipWar'" />
                    <div v-else class="fit text-h6 text-bold row justify-center items-center">
                      Click role name in table to check the role infos
                    </div>
                  </q-tab-panel>
                </q-tab-panels>
              </div>
            </div>
          </q-tab-panel>
        </q-tab-panels>
      </q-tab-panel>
    </q-tab-panels>
  </div>
</template>

<script setup>
import {
  computed, markRaw, nextTick, ref, watch,
} from 'vue';
import { useQuasar } from 'quasar';
import { useAppConfigsStore } from 'src/stores/AppConfigs';
import { useOperPanelStore } from 'src/stores/OperPanel';
import { useChipWarStore } from 'src/stores/ChipWar';
import { usePlayerInfosStore } from 'src/stores/PlayerInfos';

import ChartComp from 'src/components/common/ChartComp.vue';
import PlayerInfos from 'src/components/functions/PlayerInfos/PlayerInfos.vue';

import { downloadCsv } from 'src/utils/common';

const $q = useQuasar();
const appConfigs = useAppConfigsStore();
const operPanel = useOperPanelStore();
const chipWar = useChipWarStore();
const playerInfos = usePlayerInfosStore();

function getInfoLabel(queryConfig) {
  return `[${appConfigs.servers[queryConfig.svr]}] ${queryConfig.time}`;
}

const cacheDataInfos = ref([]);
const cacheDataOpts = computed(() => cacheDataInfos.value.map((info, index) => ({
  label: getInfoLabel(info.queryConfig),
  value: index,
})));
const curCacheIndex = ref(0);
const curCacheData = computed(() => cacheDataInfos.value[curCacheIndex.value]?.content);

const periods = computed(() => cacheDataInfos.value[curCacheIndex.value]?.content?.periods || []);
const curPeriod = ref(null);
const curChartType = ref('chip');
const tableEle = ref(null);

const curPeriodParticipants = computed(() => (
  curPeriod.value && curCacheData.value
    ? Object.entries(curCacheData.value.participantsInPeriod[curPeriod.value])
    : []));

const damageChips = computed(() => (curCacheData.value
  ? Object.entries(curCacheData.value.totalDmgOnChip[curPeriod.value])
    .filter(([, dmg]) => dmg !== 0)
    .map(([chipRace]) => chipRace)
  : []));

const queryStr = ref('');
const curDetail = ref('pvpRanking');
const curDetailRole = ref('');
const detailExisted = ref(false);
const detailQueryConfig = ref(null);
const queryRoleHist = ref([]);
const tableSortOn = ref(false);
const updateTrigger = ref(Date.now());

function viewChipHist(chip) {
  operPanel.tableConfig = curCacheData.value.tableConfig.damageHist[curPeriod.value][chip];
  operPanel.tableDlgShow = true;
}

function sortPvpRecsTable(rows, sortBy, desc) {
  const records = [...rows];

  if (sortBy) {
    records.sort((a, b) => {
      const before = desc ? b : a;
      const after = desc ? a : b;

      if (sortBy === 'race') return before[sortBy] > after[sortBy] ? 1 : before[sortBy] < after[sortBy] ? -1 : 0;
      return Number(before[sortBy]) - Number(after[sortBy]);
    });

    queryRoleHist.value.forEach((hist) => {
      hist.pvpRecRowIndex = records.findIndex((record) => record.role === hist.relateRoleObj);
    });
    tableSortOn.value = true;
  }
  return records;
}

async function viewRoleDetail(name) {
  curDetailRole.value = name;
  detailQueryConfig.value = {
    svr: cacheDataInfos.value[curCacheIndex.value].queryConfig.svr,
    name,
    time: null,
  };
  queryRoleHist.value.push({
    pvpRecRowIndex: curCacheData.value.tableConfig.pvpRanking[curPeriod.value].rowData.findIndex((row) => row.role === name),
    relateRoleObj: name,
  });
  detailExisted.value = true;
  curDetail.value = 'roleDetail';
  await nextTick();
  operPanel.reqNewData = 'PlayerInfos';
}

async function chartClickHandler(_event, _chartContext, cfg) {
  if (curChartType.value === 'chip') {
    operPanel.delegateQuery = 'PlayerInfos';
    operPanel.autoSwitchFunc = true;
    operPanel.queryConfig = {
      svr: cacheDataInfos.value[curCacheIndex.value].queryConfig.svr,
      name: cfg.config.xaxis.categories[cfg.labelIndex],
      time: null,
    };
    operPanel.curFunc = 'PlayerInfos';
  } else {
    viewRoleDetail(cfg.config.xaxis.categories[cfg.labelIndex]);
  }
}

async function tableClickHandler(event) {
  if (event.target.matches('.pvpRole')) {
    viewRoleDetail(event.target.textContent);
  } else if (event.target.matches('.tableCol th')) {
    if (event.target.textContent !== 'index' && event.target.textContent !== 'role') {
      if (!tableSortOn.value) {
        queryRoleHist.value.forEach((hist) => {
          hist.pvpRecRowIndex = curCacheData.value.tableConfig.pvpRanking[curPeriod.value].rowData.findIndex((row) => row.role === hist.relateRoleObj);
        });
      }
      tableSortOn.value = false;
    }
  }
}

function highlightCurFocusRole() {
  const { pvpRecRowIndex, relateRoleObj } = queryRoleHist.value[playerInfos.mainDataIndex];

  curDetailRole.value = relateRoleObj;
  tableEle.value[0].scrollTo(pvpRecRowIndex, 'center');
}

async function execQueryReq(queryConfig) {
  operPanel.preparing = true;
  const queryConfigLabel = getInfoLabel(queryConfig);
  const existedDataIndex = cacheDataOpts.value.findIndex((opt) => opt.label === queryConfigLabel);
  const resData = await chipWar.reqChipWarStat(queryConfig);
  const dataInfo = {
    queryConfig: {
      svr: queryConfig.svr,
      time: queryConfig.time,
    },
    content: resData ? markRaw(resData) : resData,
  };

  if (dataInfo.content === null) $q.notify('Fail to get data of chip war');
  else if (existedDataIndex === -1) {
    cacheDataInfos.value.push(dataInfo);
    if (cacheDataInfos.value.length > appConfigs.queryCacheCount) cacheDataInfos.value.shift();
    curCacheIndex.value = cacheDataInfos.value.length - 1;
  } else {
    cacheDataInfos.value[existedDataIndex] = dataInfo;
    curCacheIndex.value = existedDataIndex;
  }
  curPeriod.value = curPeriod.value || cacheDataInfos.value[curCacheIndex.value].content.periods[0];
  operPanel.preparing = false;
}

watch(() => operPanel.reqNewData, async (v) => {
  if (v === 'ChipWar') {
    await execQueryReq({ ...operPanel.queryConfig });
    operPanel.reqNewData = '';
  }
});
watch(curCacheIndex, async () => {
  const temp = curPeriod.value;

  [curPeriod.value] = periods.value.filter((p) => p !== temp);
  await nextTick();
  curPeriod.value = temp;
});
watch([curPeriod, curChartType], () => {
  detailExisted.value = false;
  queryRoleHist.value = [];
  curDetailRole.value = '';
});
watch(() => appConfigs.racesColor, () => {
  cacheDataInfos.value.forEach((info) => {
    info.content.updateChartRaceColor();
  });
  curCacheData.value.updateChartRaceColor();
  updateTrigger.value = Date.now();
});

watch(() => playerInfos.mainDataIndex, () => {
  if (operPanel.curFunc === 'ChipWar') highlightCurFocusRole();
});
watch(() => playerInfos.cacheDeletedAlert, (v) => {
  if (v && operPanel.curFunc === 'ChipWar') {
    queryRoleHist.value.shift();
    playerInfos.cacheDeletedAlert = false;
  }
});
</script>
