<template>
  <div class="fit row" :style="singleBlock ? '' : 'overflow: auto;'">
    <div v-if="cacheDataInfos.length > 0" class="col full-height column no-wrap  q-pa-sm compMinWidth">
      <div class="full-width">
        <q-select class="text-subtitle1 col" bg-color="indigo-2" popup-content-class="text-subtitle1" outlined
          v-model="leftsideCacheIndex" :options="cacheDataOpts" emit-value map-options square dense>
          <template v-slot:prepend>
            <div class="text-subtitle1 text-blue-10 queryHistLabel">
              Query history :
            </div>
          </template>
        </q-select>
      </div>
      <DataBlock :query-config="cacheDataInfos[leftsideCacheIndex].queryConfig"
        :data-content="cacheDataInfos[leftsideCacheIndex].content" :data-index="leftsideCacheIndex"
        :caller="caller || 'PlayerInfos'" />
    </div>
    <q-separator v-if="cacheDataInfos.length > 1 && !singleBlock" inset vertical />
    <div v-if="cacheDataInfos.length > 1 && !singleBlock" class="col full-height column no-wrap q-pa-sm compMinWidth">
      <div class="full-width">
        <q-select class="text-subtitle1 col" bg-color="indigo-2" popup-content-class="text-subtitle1" outlined
          v-model="rightsideCacheIndex" :options="cacheDataOpts" emit-value map-options square dense>
          <template v-slot:prepend>
            <div class="text-subtitle1 text-blue-10 queryHistLabel">
              Query history :
            </div>
          </template>
        </q-select>
      </div>
      <DataBlock :query-config="cacheDataInfos[rightsideCacheIndex].queryConfig"
        :data-content="cacheDataInfos[rightsideCacheIndex].content" :data-index="rightsideCacheIndex"
        :caller="'PlayerInfos'" />
    </div>
  </div>
</template>

<script setup>
import {
  computed, onActivated, ref, watch,
} from 'vue';
import { useQuasar } from 'quasar';
import { useAppConfigsStore } from 'src/stores/AppConfigs';
import { useOperPanelStore } from 'src/stores/OperPanel';
import { usePlayerInfosStore } from 'src/stores/PlayerInfos';

import DataBlock from './DataBlock.vue';

const $q = useQuasar();
const appConfigs = useAppConfigsStore();
const operPanel = useOperPanelStore();
const playerInfos = usePlayerInfosStore();
const props = defineProps({
  queryConfig: {
    type: Object,
  },
  singleBlock: {
    type: Boolean,
  },
  caller: {
    type: String,
  },
});

const compCaller = computed(() => (props.caller || 'PlayerInfos'));
const cacheDataInfos = ref(props.objData || []);
const cacheDataOpts = computed(() => cacheDataInfos.value.map((info, index) => ({
  label: `[${appConfigs.servers[info.queryConfig.svr]}] ${info.queryConfig.name}`,
  value: index,
})));
const leftsideCacheIndex = ref(0);
const rightsideCacheIndex = ref(1);

function checkQueryCache() {
  if (cacheDataInfos.value.length > appConfigs.queryCacheCount) {
    if (leftsideCacheIndex.value === 0) leftsideCacheIndex.value = 1;
    if (rightsideCacheIndex.value === 0) rightsideCacheIndex.value = 1;
    cacheDataInfos.value.shift();
    leftsideCacheIndex.value -= 1;
    playerInfos.cacheDeletedAlert = true;
  }
}

async function execQueryReq(queryConfig) {
  operPanel.preparing = true;
  const queryConfigLabel = `[${appConfigs.servers[queryConfig.svr]}] ${queryConfig.name}`;
  const curCacheIndex = cacheDataOpts.value.findIndex((opt) => opt.label === queryConfigLabel);
  const dataInfo = {
    queryConfig: {
      svr: queryConfig.svr,
      name: queryConfig.name,
    },
    content: await playerInfos.reqPlayerInfos(queryConfig),
  };

  if (dataInfo.content === null) $q.notify('No data! Change condition and query again.');
  else if (curCacheIndex === -1) {
    cacheDataInfos.value.push(dataInfo);
    checkQueryCache();
    if (props.singleBlock) leftsideCacheIndex.value = cacheDataInfos.value.length - 1;
    else rightsideCacheIndex.value = cacheDataInfos.value.length - 1;
  } else {
    cacheDataInfos.value[curCacheIndex] = dataInfo;
    if (props.singleBlock || cacheDataInfos.value.length === 1) {
      leftsideCacheIndex.value = curCacheIndex;
    } else rightsideCacheIndex.value = curCacheIndex;
    playerInfos.updateExistedDataAlert = true;
  }
  operPanel.preparing = false;
}

onActivated(() => {
  if (operPanel.delegateQuery === 'PlayerInfos') {
    operPanel.reqNewData = 'PlayerInfos';
    operPanel.delegateQuery = null;
  }
});

watch(leftsideCacheIndex, (v) => {
  playerInfos.mainDataIndex = v;
});

watch(() => operPanel.reqNewData, async (v) => {
  if (v === 'PlayerInfos' && (compCaller.value === operPanel.curFunc)) {
    await execQueryReq(props.queryConfig || operPanel.queryConfig);
    operPanel.reqNewData = '';
  }
}, { flush: 'post' });

watch(() => operPanel.refreshData, async (v) => {
  if (v) {
    const refreshDataList = cacheDataInfos.value.filter((info) => (
      operPanel.banAcntIds.includes(Object.values(info.content.roles)[0].UID.GID)
    ));

    try {
      await Promise.all(refreshDataList.map((req) => execQueryReq(req.queryConfig)));

      $q.notify({
        type: 'positive',
        icon: 'fa-regular fa-circle-check',
        message: 'Success to refresh data.',
      });
    } catch (err) {
      console.log('[PlayerInfos] refresh err: ', err);
      $q.notify('Fail to refresh data.');
    }

    operPanel.banBatches = [];
    operPanel.refreshData = false;
  }
});

</script>
