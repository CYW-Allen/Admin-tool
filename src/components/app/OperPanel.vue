<template>
  <div class="q-pa-sm row no-wrap">
    <q-scroll-area class="col q-mx-xs" style="height: 60px;">
      <div class="fit row no-wrap cfgField">
        <!-- functions -->
        <div class="col subCfg">
          <q-select v-model="operPanel.curFunc" :options="appConfigs.appFuncs" style="border: 1px solid lightgray"
            bg-color="blue-1" popup-content-class="text-h6" square filled hide-bottom-space emit-value map-options
            :disable="operPanel.preparing">
            <template v-slot:prepend>
              <div class="text-h6 text-blue-10 text-bold ellipsis">
                Category :
              </div>
            </template>
            <template v-slot:selected-item="scope">
              <span class="text-h6 ellipsis">{{ scope.opt.label }}</span>
            </template>
          </q-select>
        </div>

        <!-- datepicker -->
        <div class="col subCfg" v-if="operPanel.activateDatepicker">
          <q-input input-class="text-h6 cursor-pointer ellipsis" bg-color="blue-1" v-model="operPanel.datepickerVal"
            @click="timePicker.show()" readonly standout square style="border: 1px solid lightgray"
            :disable="operPanel.preparing">
            <template v-slot:prepend>
              <div class="text-h6 text-blue-10 text-bold ellipsis">
                Time :
              </div>
            </template>
            <template v-slot:append>
              <q-icon name="fa-solid fa-calendar-day" class="cursor-pointer">
                <q-popup-proxy ref="timePicker" cover transition-show="scale" transition-hide="scale">
                  <q-date v-model="operPanel.queryConfig.time" :options="getDatepickerOpts"
                    :mask="operPanel.curFunc === 'PvpHistory' ? 'YYYY_MM' : 'YYYY-MM-DD'"
                    :range="operPanel.curFunc !== 'ChipWar' && operPanel.curFunc !== 'PvpHistory'"
                    :default-view="operPanel.curFunc === 'PvpHistory' ? 'Years' : 'Calendar'"
                    :minimal="operPanel.curFunc === 'PvpHistory'" :emit-immediately="operPanel.curFunc === 'PvpHistory'"
                    @update:model-value="hidePartialDP">
                    <div class="row items-center justify-end">
                      <q-btn v-close-popup class="text-h6" label="Close" color="primary" flat />
                    </div>
                  </q-date>
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>
        </div>

        <!-- svr switcher -->
        <div class="col subCfg" v-if="operPanel.activateSvrSelector">
          <q-select bg-color="blue-1" style="border: 1px solid lightgray" popup-content-class="text-h6" square filled
            hide-bottom-space v-model="operPanel.queryConfig.svr" :disable="operPanel.preparing"
            :options="operPanel.curFunc === 'ItemPurchase' ? appConfigs.serverIndexTable : appConfigs.serverIndexTable.slice(1)"
            emit-value map-options>
            <template v-slot:prepend>
              <div class="text-h6 text-blue-10 text-bold ellipsis">
                Server :
              </div>
            </template>
            <template v-slot:selected-item="scope">
              <span class="text-h6 ellipsis">{{ scope.opt.label }}</span>
            </template>
          </q-select>
        </div>

        <!-- input text -->
        <div class="col subCfg" v-if="operPanel.activateInputField">
          <q-input standout="bg-blue-3" input-class="text-h6" square bg-color="blue-1" style="border: 1px solid lightgray"
            v-model="operPanel.queryConfig.name" @keyup="finishInput" hide-bottom-space :disable="operPanel.preparing">
            <template v-slot:prepend>
              <div class="text-h6 text-blue-10 text-bold ellipsis">Object : </div>
            </template>
          </q-input>
        </div>

        <!-- period picker -->
        <div class="col subCfg row" v-if="operPanel.activatePeriodPicker">
          <q-select class="col" bg-color="blue-1" square filled style="border: 1px solid lightgray" hide-bottom-space
            :options="[...Array(8).keys()]" v-model="operPanel.queryConfig.time.days" :disable="operPanel.preparing">
            <template v-slot:prepend>
              <div class="text-h6 text-bold text-indigo ellipsis">Days :</div>
            </template>
          </q-select>
          <q-select class="col" bg-color="blue-1" square filled style="border: 1px solid lightgray" hide-bottom-space
            :options="[...Array(24).keys()]" v-model="operPanel.queryConfig.time.hours" :disable="operPanel.preparing">
            <template v-slot:prepend>
              <div class="text-h6 text-bold text-green-9 ellipsis">Hours :</div>
            </template>
          </q-select>
          <q-select class="col" bg-color="blue-1" square filled style="border: 1px solid lightgray" hide-bottom-space
            :options="[...Array(60).keys()]" v-model="operPanel.queryConfig.time.mins" :disable="operPanel.preparing">
            <template v-slot:prepend>
              <div class="text-h6 text-bold text-orange-10 ellipsis">Mins :</div>
            </template>
          </q-select>
          <q-btn glossy push square color="grey" icon="fa-solid fa-arrow-rotate-right" title="Clear config"
            @click="clearConfig" />
        </div>
      </div>
    </q-scroll-area>

    <q-btn id="sendCfg" v-if="operPanel.curFunc !== 'SvrDashboard'" class="text-subtitle1" glossy color="primary"
      icon="fa-solid fa-magnifying-glass" push @click="operPanel.reqNewData = operPanel.curFunc"
      :disable="operPanel.deactivateReqSending" />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { date } from 'quasar';
import { useAppConfigsStore } from 'src/stores/AppConfigs';
import { useOperPanelStore } from 'src/stores/OperPanel';

const appConfigs = useAppConfigsStore();
const operPanel = useOperPanelStore();
const timePicker = ref(null);
const getDatepickerOpts = (day) => day >= '2022/03/22' && day <= date.formatDate(Date.now(), 'YYYY/MM/DD');

function hidePartialDP(_val, curTimeUnit) {
  if (operPanel.curFunc === 'PvpHistory' && curTimeUnit === 'month') {
    timePicker.value.hide();
  }
}

function finishInput(event) {
  if (event.key === 'Enter') document.getElementById('sendCfg').click();
}

const dateFormat = 'YYYY-MM-DD';
const curTime = new Date();
const today = date.formatDate(curTime, dateFormat);
const twoWeeksAgo = date.formatDate(date.subtractFromDate(curTime, { days: 13 }), dateFormat);

function clearConfig() {
  operPanel.queryConfig.time = { days: 0, hours: 0, mins: 0 };
}

watch(() => operPanel.curFunc, () => {
  if (operPanel.autoSwitchFunc === false) {
    switch (operPanel.curFunc) {
      case 'SvrStat':
      case 'ItemPurchase':
        operPanel.queryConfig = {
          name: null,
          time: { from: today, to: today },
        };
        break;
      case 'PlayerInfos':
      case 'NameHistory':
        operPanel.queryConfig = { name: null, time: null };
        break;
      case 'AcntRelation':
        operPanel.queryConfig = {
          name: null,
          time: { from: twoWeeksAgo, to: today },
        };
        break;
      case 'ChipWar':
        operPanel.queryConfig = { name: null, time: today };
        break;
      case 'PvpHistory':
        operPanel.queryConfig = { name: null, time: date.formatDate(curTime, 'YYYY_MM') };
        break;
      case 'ItemSellRanking':
        operPanel.queryConfig = {
          name: null,
          time: { days: 1, hours: 0, mins: 0 },
        };
        break;
      default:
        operPanel.queryConfig = { svr: 0, name: null, time: null };
    }

    if (operPanel.curFunc === 'ItemPurchase') operPanel.queryConfig.svr = -1;
    else operPanel.queryConfig.svr = 0;
  }
  operPanel.autoSwitchFunc = false;
});

watch(() => operPanel.datepickerVal, (v) => {
  if (!v) return;
  if (operPanel.curFunc === 'AcntRelation') {
    const fromT = new Date(operPanel.queryConfig.time.from);
    const toT = new Date(operPanel.queryConfig.time.to);
    const daysOfPeriod = date.getDateDiff(toT, fromT, 'days') + 1;

    if (daysOfPeriod > 13) {
      operPanel.queryConfig.time.to = date.formatDate(date.addToDate(fromT, { days: 13 }), 'YYYY-MM-DD');
    }
  }
});

</script>
