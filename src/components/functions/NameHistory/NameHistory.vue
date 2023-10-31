<template>
  <div v-if="cacheDataInfos.length > 0" class="fit column">
    <q-select class="text-subtitle1" bg-color="indigo-2" popup-content-class="text-subtitle1" outlined
      v-model="curCacheIndex" :options="cacheDataOpts" emit-value map-options square dense>
      <template v-slot:prepend>
        <div class="text-subtitle1 text-blue-10">Query history :</div>
      </template>
    </q-select>

    <div class="col row" style="overflow: auto;">
      <div class="full-height col compMinWidth q-pa-md">
        <q-table ref="tableEle" class="sticky-header-row" table-header-style="text-align:center"
          :title="curCacheData.title" :rows="curCacheData.rows" separator="horizontal" square virtual-scroll
          :pagination="{ rowsPerPage: 0 }" :rows-per-page-options="[0]" :virtual-scroll-sticky-size-start="48" hide-bottom
          :filter="tableQuery">
          <template v-slot:top-right>
            <q-input v-model="tableQuery" type="text" class="q-mr-md" dense debounce="500" placeholder="Query...">
              <template v-slot:prepend>
                <q-icon name="fa-solid fa-magnifying-glass" />
              </template>
            </q-input>
            <q-btn class="glossy text-subtitle1" color="grey-8" icon="fa-solid fa-download"
              @click="downloadCsv(curCacheData.title, curCacheData.rows)" push />
          </template>
          <template v-slot:header-cell-index="props">
            <q-th class="text-center">{{ props.col.name }}</q-th>
          </template>
          <template v-slot:body="props">
            <q-tr :props="props" :class="curFocusAcnt === props.row.account ? 'bg-amber-3' : ''">
              <q-td key="index" :props="props" style="text-align: center;">
                {{ props.rowIndex + 1 }}
              </q-td>
              <q-td key="account" :props="props">
                <span style="color: blue;text-decoration: underline;cursor: pointer;" @click="getAcntDetail({
                  svr: cacheDataInfos[curCacheIndex].queryConfig.svr,
                  name: props.row.account
                }, props.row.account)">
                  {{ props.row.account }}
                </span>
              </q-td>
              <q-td key="firstUseTime" :props="props">
                {{ props.row.firstUseTime }}
              </q-td>
              <q-td key="lastUseTime" :props="props">
                {{ props.row.lastUseTime }}
              </q-td>
              <q-td key="useDays" :props="props">
                {{ props.row.useDays }}
              </q-td>
              <q-td key="onlineTimes" :props="props">
                {{ props.row.onlineTimes }}
              </q-td>
            </q-tr>
          </template>
        </q-table>
      </div>
      <div class="full-height col row justify-center items-center compMinWidth">
        <acntDetail v-if="detailExisted" :query-config="detailQueryConfig" :single-block="true" :caller="'NameHistory'" />
        <div v-else class="text-h6 text-bold">
          Click account field in table to check the details
        </div>
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
import { useNameHistoryStore } from 'src/stores/NameHistory';
import { usePlayerInfosStore } from 'src/stores/PlayerInfos';
import { downloadCsv } from 'src/utils/common';

import acntDetail from '../PlayerInfos/PlayerInfos.vue';

const $q = useQuasar();
const appConfigs = useAppConfigsStore();
const operPanel = useOperPanelStore();
const nameHistory = useNameHistoryStore();
const playerInfos = usePlayerInfosStore();

const cacheDataInfos = ref([]);
const cacheDataOpts = computed(() => cacheDataInfos.value.map((info, index) => ({
  label: `[${appConfigs.servers[info.queryConfig.svr]}] ${info.queryConfig.name}`,
  value: index,
})));
const curCacheIndex = ref(0);
const curCacheData = computed(() => cacheDataInfos.value[curCacheIndex.value]?.content || {});

const tableEle = ref(null);
const tableQuery = ref('');

const detailExisted = ref(false);
const curFocusAcnt = ref('');
const detailQueryConfig = ref(null);
const queryAcntHis = ref([]);

async function getAcntDetail(queryConfig, focusAcnt) {
  detailQueryConfig.value = queryConfig;
  queryAcntHis.value.push({
    nameHistIndex: curCacheIndex.value,
    relateRowIndex: curCacheData.value.rows.findIndex((row) => row.account === focusAcnt),
    relateDetailObj: focusAcnt,
  });
  curFocusAcnt.value = focusAcnt;
  detailExisted.value = true;
  await nextTick();
  operPanel.reqNewData = 'PlayerInfos';
}

async function execQueryReq(queryConfig) {
  operPanel.preparing = true;

  const queryConfigLabel = `[${appConfigs.servers[queryConfig.svr]}] ${queryConfig.name}`;
  const existedDataIndex = cacheDataOpts.value.findIndex((opt) => opt.label === queryConfigLabel);
  const dataInfo = {
    queryConfig: {
      svr: queryConfig.svr,
      name: queryConfig.name,
    },
    content: await nameHistory.reqNameHistory(queryConfig),
  };

  if (dataInfo.content === null) $q.notify('There is no history of this name');
  else if (dataInfo.content === undefined) $q.notify('Fail to get the history of this name');
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

async function highlightCurFocusAcnt() {
  const { nameHistIndex, relateRowIndex, relateDetailObj } = queryAcntHis.value[playerInfos.mainDataIndex];

  if (nameHistIndex !== curCacheIndex.value) {
    curCacheIndex.value = nameHistIndex;
    await nextTick();
  }
  curFocusAcnt.value = relateDetailObj;
  tableEle.value.scrollTo(relateRowIndex, 'center');
}

watch(() => operPanel.reqNewData, async (v) => {
  if (v === 'NameHistory') {
    await execQueryReq(operPanel.queryConfig);
    operPanel.reqNewData = '';
  }
});
watch(() => playerInfos.mainDataIndex, () => {
  if (operPanel.curFunc === 'NameHistory') highlightCurFocusAcnt();
});
watch(() => playerInfos.cacheDeletedAlert, (v) => {
  if (v && operPanel.curFunc === 'NameHistory') {
    queryAcntHis.value.shift();
    playerInfos.cacheDeletedAlert = false;
  }
});

</script>
