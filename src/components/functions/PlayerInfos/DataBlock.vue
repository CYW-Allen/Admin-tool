<template>
  <!-- control field -->
  <div class="full-width row">
    <q-select class="text-subtitle1 col" bg-color="orange-2" popup-content-class="text-subtitle1" outlined
      v-model="curRole" :options="roleList" dense square>
      <template v-slot:prepend>
        <div class="text-subtitle1 text-blue-10">
          Role :
        </div>
      </template>
    </q-select>
    <q-select class="text-subtitle1 col" bg-color="light-blue-2" popup-content-class="text-subtitle1" outlined
      v-model="displayType" :options="playerInfos.chartList" emit-value map-options dense square>
      <template v-slot:prepend>
        <div class="text-subtitle1 text-blue-10">
          Type :
        </div>
      </template>
    </q-select>
    <q-btn v-if="displayType !== 'info' && displayType !== 'purchase'" color="green" glossy push icon="fa-solid fa-table"
      @click="viewChartDetail" dense square title="view table" />
  </div>

  <!-- content field -->
  <!-- table area -->
  <q-table v-if="displayType === 'info' || displayType === 'purchase'" square
    :class="`full-width col q-mt-md q-mx-auto ${displayType === 'info' ? 'infoTableField' : 'purchaseTableField purchaseTable'}`"
    :columns="roleDataRecs[curRole] ? roleDataRecs[curRole].tableConfig[displayType].col : []"
    :rows="roleDataRecs[curRole] ? roleDataRecs[curRole].tableConfig[displayType].row : []"
    :pagination="{ rowsPerPage: 0 }" :rows-per-page-options="[0]" :hide-header="displayType === 'info'" hide-bottom
    separator="cell" virtual-scroll :filter="queryStr" @click="viewItemDetail">
    <template v-slot:top-left v-if="displayType === 'purchase'">
      <div class="text-h5">{{ `${curRole} (${roleDataRecs[curRole].description.race})` }}</div>
    </template>
    <template v-slot:top-right v-if="displayType === 'purchase'">
      <q-input dense debounce="300" v-model="queryStr" placeholder="Query...">
        <template v-slot:prepend>
          <q-icon name="fa-solid fa-magnifying-glass" />
        </template>
      </q-input>
      <q-btn class="text-subtitle1 q-ml-md" color="grey-8" icon="fa-solid fa-download" glossy push @click="downloadCsv(
        `[${roleDataRecs[curRole].description.svr}] ${curRole} (${roleDataRecs[curRole].description.race}) purchase history`,
        roleDataRecs[curRole].tableConfig.purchase.row
      )" />
    </template>
    <template v-slot:body-cell-val="props">
      <q-td v-if="(typeof props.value !== 'string' && typeof props.value !== 'number')" style="padding: 0">
        <table
          v-if="props.rowIndex !== 18 || roleDataRecs[curRole].tableConfig.info.row[props.rowIndex].prop !== 'lockHistory'"
          style="width: 100%; margin: 0">
          <tr class="row" v-for="(p, i) in Object.entries(props.value)" :key="i" style="margin: 0">
            <td class="text-center bg-cyan-2 col-4">{{ p[0] }}</td>
            <td class="bg-cyan-1 col-8">{{ p[1] }}</td>
          </tr>
        </table>
        <div v-else :style="`width:100%; ${props.value.length < 4 ? '' : 'height:175px;overflow:auto;'}`">
          <q-list separator>
            <q-item v-for="(msg, i) in props.value" :key="i">
              <q-item-section>
                <q-item-label>{{ msg.split(',')[0] }}</q-item-label>
                <q-item-label>{{ msg.split(',')[1] }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </div>
      </q-td>
      <q-td v-else class="row justify-center items-center">
        <div :class="displayType === 'info' && (props.rowIndex === 3 || props.rowIndex === 17) ? 'btnField' : ''">
          {{ props.value }}
        </div>
        <q-btn v-if="displayType === 'info' && props.rowIndex === 3" label="Copy to dev server" class="glossy q-ml-md"
          color="blue-6" dense @click="copy2SvrDlgShow = true" :loading="copyIsProcessing">
          <template v-slot:loading>
            <q-spinner-facebook></q-spinner-facebook>
          </template>
        </q-btn>
        <q-btn v-else-if="displayType === 'info' && props.rowIndex === 17"
          :loading="operPanel.banIsProcessing === dataIndex" :label="`${props.value === 'Normal' ? 'lock' : 'unlock'}`"
          class="glossy q-ml-md q-px-sm" :color="`${props.value === 'Normal' ? 'negative' : 'positive'}`" dense
          @click="showBanDlg(props.value)" />
      </q-td>
    </template>
    <template v-slot:body-cell-Id="props">
      <td class="text-center">
        <span class="purchaseItem cursor-pointer" style="color:blue;text-decoration:underline;">
          {{ props.value }}
        </span>
      </td>
    </template>
  </q-table>

  <!-- chart area -->
  <div v-else class="full-width col q-pa-sm" style="border: 1px solid transparent;">
    <ChartComp v-if="operPanel.curFunc === caller && displayType === 'loginHistory'"
      :chart-config="roleDataRecs[curRole].chartConfig[displayType]('loginHistory', dataContent.roles[curRole].LoginHistory)" />
    <ChartComp v-else-if="operPanel.curFunc === caller && displayType !== 'loginHistory'"
      :chart-config="roleDataRecs[curRole].chartConfig[displayType]" />
  </div>

  <!-- copy role to dev server dialog -->
  <q-dialog v-model="copy2SvrDlgShow">
    <q-card style="width: 100%">
      <q-card-section class="q-py-sm">
        <q-field class="text-h5 text-bold" borderless>
          <template v-slot:prepend>
            <q-icon name="fa-solid fa-user-group" size="sm" class="q-pt-sm" />
          </template>
          <template v-slot:control>
            <div class="text-h5 text-bold">
              <span>Copy</span>
              <span class="text-red">{{ ` ${curRole} ` }}</span>
              <span>to dev server</span>
            </div>
          </template>
        </q-field>
      </q-card-section>
      <q-separator />
      <q-card-section>
        <q-input filled v-model="copy2Role" bg-color="blue-1" class="q-mt-md text-h6">
          <template v-slot:prepend>
            <div class="text-indigo text-h6">Role name in dev server :</div>
          </template>
        </q-input>
      </q-card-section>
      <q-card-actions align="right" class="q-mr-sm q-mb-sm">
        <q-btn glossy color="grey-8" label="cancel" v-close-popup />
        <q-btn glossy color="blue-8" label="confirm" @click="copy2dev" v-close-popup :disable="copy2Role.length === 0" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import {
  computed, onDeactivated, ref, watch,
} from 'vue';
import { useQuasar } from 'quasar';
import { downloadCsv } from 'src/utils/common';
import { useAppConfigsStore } from 'src/stores/AppConfigs';
import { useOperPanelStore } from 'src/stores/OperPanel';
import { usePlayerInfosStore } from 'src/stores/PlayerInfos';
import ChartComp from 'src/components/common/ChartComp.vue';

const $q = useQuasar();
const appConfigs = useAppConfigsStore();
const operPanel = useOperPanelStore();
const playerInfos = usePlayerInfosStore();
const props = defineProps({
  queryConfig: {
    type: Object,
    required: true,
  },
  dataContent: {
    type: Object,
    required: true,
  },
  dataIndex: {
    type: Number,
    required: true,
  },
  caller: {
    type: String,
    required: true,
  },
});

const displayType = ref('info');
const roleList = computed(() => Object.keys(props.dataContent.roles));
const curRole = ref(roleList.value[0]);
const roleDataRecs = ref({
  [curRole.value]: playerInfos.getRoleDataInst(props.queryConfig, props.dataContent.roles[curRole.value], props.dataContent.purchase[curRole.value]),
});
const queryStr = ref('');
const copy2SvrDlgShow = ref(false);
const copy2Role = ref('');
const copyIsProcessing = ref(false);

function viewItemDetail(event) {
  if (event.target.matches('.purchaseItem')) {
    operPanel.delegateQuery = 'ItemPurchase';
    operPanel.autoSwitchFunc = true;
    operPanel.queryConfig = {
      svr: props.queryConfig.svr || 0,
      name: event.target.textContent,
      time: operPanel.getDefaultPeriod(),
    };
    operPanel.curFunc = 'ItemPurchase';
  }
}

function viewChartDetail() {
  operPanel.tableConfig = roleDataRecs.value[curRole.value].tableConfig[displayType.value];
  operPanel.tableConfig.queryConfig = { ...props.queryConfig };
  operPanel.tableDlgShow = true;
}

function simulateCopy2Dev(source, target) {
  return new Promise((resolve) => {
    console.log(`Start to copy ${source} to ${target}`);
    setTimeout(() => resolve(), 3000);
  });
}

function copy2dev() {
  copyIsProcessing.value = true;
  simulateCopy2Dev(curRole.value, copy2Role.value)
    .then(() => {
      $q.notify({
        type: 'positive',
        icon: 'fa-regular fa-circle-check',
        message: 'Success to copy role to dev server',
      });
    })
    .catch((err) => {
      console.log(`[copy2dev] Error: ${err.message}`);
      $q.notify({ message: 'Fail to copy role' });
    })
    .finally(() => { copyIsProcessing.value = false; });
}

async function showBanDlg(status) {
  operPanel.banBatches = [{
    action: status === 'Normal' ? 'ban' : 'unban',
    GID: roleDataRecs.value[curRole.value].tableConfig.info.row[0].val.GID,
    name: curRole.value,
    acntSN: roleDataRecs.value[curRole.value].tableConfig.info.row[2].val,
  }];
  const uidList = await appConfigs.getAcntUid(operPanel.banBatches);
  uidList.forEach((uid, index) => {
    operPanel.banBatches[index].UID = uid;
  });

  if (uidList.length > 0) {
    operPanel.banIsProcessing = props.dataIndex;
    operPanel.banDlgShow = true;
  }
}

onDeactivated(() => {
  // avoid chart generation error (? chart container is unmounted)
  if (props.caller === 'ItemSellRanking') {
    displayType.value = 'info';
  }
});

watch(curRole, (role) => {
  if (roleDataRecs.value[role] === undefined) {
    roleDataRecs.value[role] = playerInfos.getRoleDataInst(props.queryConfig, props.dataContent.roles[role], props.dataContent.purchase[role]);
  }
});

watch(roleList, (list) => {
  [curRole.value] = list;
});

watch(() => props.dataContent, (data) => {
  roleDataRecs.value[curRole.value] = playerInfos.getRoleDataInst(props.queryConfig, data.roles[curRole.value], data.purchase[curRole.value]);
}, { flush: 'post' });

</script>
