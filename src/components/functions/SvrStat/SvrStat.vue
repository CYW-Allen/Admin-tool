<template>
  <div class="fit row wrap" style="overflow: auto;">
    <div v-if="cacheDataInfos.length > 0" class="col full-height column no-wrap q-pa-md compMinWidth">
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
        :data="cacheDataInfos[leftsideCacheIndex].content" />
    </div>
    <q-separator v-if="cacheDataInfos.length > 1" inset vertical />
    <div v-if="cacheDataInfos.length > 1" class="col full-height column no-wrap q-pa-md compMinWidth">
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
        :data="cacheDataInfos[rightsideCacheIndex].content" />
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
import { useSvrStatStore } from 'src/stores/SvrStat';
import DataBlock from './DataBlock.vue';

const $q = useQuasar();
const appConfigs = useAppConfigsStore();
const operPanel = useOperPanelStore();
const svrStat = useSvrStatStore();

const cacheDataInfos = ref([]);

function getInfoLabel(queryConfig) {
  return `[${appConfigs.servers[queryConfig.svr]}]`
    + ` ${queryConfig.time.from || queryConfig.time}`
    + ` ~ ${queryConfig.time.to || queryConfig.time}`;
}

const cacheDataOpts = computed(() => cacheDataInfos.value.map((info, index) => ({
  label: getInfoLabel(info.queryConfig),
  value: index,
})));
const leftsideCacheIndex = ref(0);
const rightsideCacheIndex = ref(1);

function getCacheIndexOfQuery() {
  const curQueryLabel = getInfoLabel(operPanel.queryConfig);

  return cacheDataOpts.value.findIndex((opt) => opt.label === curQueryLabel);
}

function checkQueryCache() {
  if (cacheDataInfos.value.length > appConfigs.queryCacheCount) {
    if (leftsideCacheIndex.value === 0) leftsideCacheIndex.value = 1;
    cacheDataInfos.value.shift();
    leftsideCacheIndex.value -= 1;
  }
}

onActivated(() => {
  if (operPanel.delegateQuery === 'SvrStat') {
    operPanel.reqNewData = 'SvrStat';
    operPanel.delegateQuery = null;
  }
});

watch(() => operPanel.reqNewData, async (v) => {
  if (v === 'SvrStat') {
    operPanel.preparing = true;

    const curCacheIndex = getCacheIndexOfQuery();
    const dataInfo = {
      queryConfig: {
        svr: operPanel.queryConfig.svr,
        time: operPanel.queryConfig.time,
      },
      content: await svrStat.reqSvrStat(operPanel.queryConfig),
    };

    if (dataInfo.content === null) $q.notify('Fail to get data! Change the condition and query again.');
    else if (curCacheIndex === -1) {
      cacheDataInfos.value.push(dataInfo);
      checkQueryCache();
      rightsideCacheIndex.value = cacheDataInfos.value.length - 1;
    } else {
      cacheDataInfos.value[curCacheIndex] = dataInfo;
      if (cacheDataInfos.value.length === 1) leftsideCacheIndex.value = curCacheIndex;
      else rightsideCacheIndex.value = curCacheIndex;
    }

    operPanel.preparing = false;
    operPanel.reqNewData = '';
  }
});
</script>
