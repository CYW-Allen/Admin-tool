<template>
  <q-layout view="hHh LpR fFf">
    <q-header elevated class="bg-blue-2">
      <q-bar class="glossy q-py-md">
        <div class="col text-center text-weight-bold">Game Admin</div>
        <q-space />
        <q-icon name="fa-solid fa-gear" class="cursor-pointer" title="設定" @click="appConfigs.showSettingDlg = true" />
      </q-bar>

      <AppSetting />

      <OperPanel />
    </q-header>

    <q-page-container>
      <q-page :style-fn="tweakPageH" class="bg-light-blue-1" style="overflow: hidden;">
        <KeepAlive>
          <component :is="functionComps[operPanel.curFunc]"></component>
        </KeepAlive>
      </q-page>

      <q-inner-loading :showing="operPanel.preparing">
        <div class="text-green-8 text-h4 q-mb-md">Processing...</div>
        <q-spinner-gears size="10em" color="green-8" />
      </q-inner-loading>

      <ChartTable />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { defineAsyncComponent } from 'vue';
import { useAppConfigsStore } from 'src/stores/AppConfigs';
import { useOperPanelStore } from 'src/stores/OperPanel';
import AppSetting from 'src/components/app/AppSetting.vue';
import OperPanel from 'src/components/app/OperPanel.vue';
import ChartTable from 'src/components/common/ChartTable.vue';

const appConfigs = useAppConfigsStore();
const operPanel = useOperPanelStore();

const functionComps = {};

function tweakPageH(offset) {
  return { height: offset ? `calc(100vh - ${offset}px)` : '100vh' };
}

appConfigs.appFuncs.forEach((func) => {
  functionComps[func.value] = defineAsyncComponent(() => (
    import(`../components/functions/${operPanel.curFunc}/${operPanel.curFunc}.vue`)
  ));
});

</script>
