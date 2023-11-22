<template>
  <q-dialog v-model="appConfigs.showHelpDlg" persistent :maximized="true">
    <q-card class="fit column">
      <q-card-section class="col column">
        <q-select v-model="curDemo" :options="demoList" style="border: 1px solid lightgray" bg-color="blue-1"
          class="text-h6" popup-content-class="text-h6" square filled hide-bottom-space emit-value map-options>
          <template v-slot:prepend>
            <div class="text-h6 text-blue-10 text-bold">
              Function demonstration :
            </div>
          </template>
          <template v-slot:selected-item="scope">
            <span :class="curDemo === null ? 'text-grey-6' : ''">{{ scope.opt.label }}</span>
          </template>
        </q-select>

        <q-card class="col row justify-center items-center q-mt-sm">
          <q-img v-if="curDemo !== null" :src="`./about/operation-${curDemo}-min.gif`" loading="lazy"
            spinner-color="primary" spinner-size="82px" width="80%" />
        </q-card>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn label="Close" color="grey-6" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useAppConfigsStore } from 'src/stores/AppConfigs';

const appConfigs = useAppConfigsStore();
const demoList = computed(() => ([
  { label: 'Choose one function to demonstrate...', value: null, disable: true },
  { label: 'App Config', value: 'AppConfig' },
  ...appConfigs.appFuncs.filter((e) => e.value !== 'BanList'),
]));
const curDemo = ref(null);
</script>
