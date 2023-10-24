<template>
  <div class="fit column">
    <div class="q-my-md q-mx-auto" style="width: 300px;">
      <q-select class="text-h6" popup-content-class="text-subtitle1" outlined v-model="curSvrId"
        :options="appConfigs.serverIndexTable.slice(1)" emit-value map-options>
        <template v-slot:prepend>
          <div class="text-subtitle1 text-blue-10" style="width: 100px">
            Server :
          </div>
        </template>
      </q-select>
    </div>

    <div v-if="isLoading" class="col row justify-center items-center">
      <q-spinner-cube color="primary" size="10em" />
    </div>
    <q-scroll-area v-else class="col full-width q-px-xl">
      <div class="column" v-for="chartConfig in dashboard.svrChartConfig[curSvrId] || []" :key="chartConfig.kind"
        style="height: 650px;">
        <q-field borderless hide-bottom-space>
          <template v-slot:control>
            <div class="full-width row justify-center items-center no-outline text-h5">
              <span>{{ `${chartConfig.kind} chart` }}</span>
              <q-btn glossy push square class="q-ml-md q-mt-sm" icon="fa-solid fa-table" color="primary"
                @click="displayChartTable(chartConfig.tableCfg)" />
            </div>
          </template>
        </q-field>
        <ChartComp v-if="operPanel.curFunc === 'SvrDashboard'" class="col" :chart-config="chartConfig" />
      </div>
    </q-scroll-area>
  </div>
</template>

<script setup>
import { useAppConfigsStore } from 'src/stores/AppConfigs';
import { useOperPanelStore } from 'src/stores/OperPanel';
import { useSvrDashboard } from 'src/stores/SvrDashboard';
import { ref, watch } from 'vue';
import ChartComp from 'src/components/common/ChartComp.vue';

const appConfigs = useAppConfigsStore();
const operPanel = useOperPanelStore();
const dashboard = useSvrDashboard();

const curSvrId = ref(0);
const isLoading = ref(true);

function displayChartTable(tableConfig) {
  operPanel.tableConfig = tableConfig;
  operPanel.tableDlgShow = true;
}

dashboard.processSvrInfo(curSvrId.value).then(() => { isLoading.value = false; });

watch(curSvrId, (svrId) => {
  isLoading.value = true;
  dashboard.processSvrInfo(svrId).then(() => { isLoading.value = false; });
});
</script>
