<template>
  <q-layout view="hHh LpR fFf">
    <q-header elevated class="bg-blue-2">
      <q-bar class="glossy q-py-md">
        <div class="col text-center text-weight-bold">Game Admin</div>
        <q-space />
        <q-icon name="fa-solid fa-gear" class="cursor-pointer" title="設定" @click="appConfigs.showSettingDlg = true" />
      </q-bar>

      <AppSetting />
      <!-- Operpanel component -->
    </q-header>

    <q-page-container>
      <q-page :style-fn="tweakPageH" class="bg-light-blue-1" style="overflow: hidden;">
        <!-- function components -->
      </q-page>
      <!-- loading component -->
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { useAppConfigsStore } from 'src/stores/AppConfigs';
import AppSetting from 'src/components/app/AppSetting.vue';

const appConfigs = useAppConfigsStore();

function tweakPageH(offset) {
  return { height: offset ? `calc(100vh - ${offset}px)` : '100vh' };
}

</script>
