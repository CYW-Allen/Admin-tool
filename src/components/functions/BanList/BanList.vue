<template>
  <div class="fit q-pa-md">
    <q-table v-if="bannedAcnts.length" class="sticky-header-row" table-header-style="text-align:center"
      :title="tableTitle" :rows="bannedAcnts" separator="horizontal" virtual-scroll :pagination="{ rowsPerPage: 0 }"
      :rows-per-page-options="[0]" :virtual-scroll-sticky-size-start="48" hide-bottom :filter="tableQuery"
      style="max-height: 100%;" row-key="GID">
      <template v-slot:top-right>
        <q-input v-model="tableQuery" type="text" class="q-mr-md" dense debounce="500" placeholder="Query...">
          <template v-slot:prepend>
            <q-icon name="fa-solid fa-magnifying-glass" />
          </template>
        </q-input>
        <q-btn class="glossy text-subtitle1" color="grey-8" icon="fa-solid fa-download"
          @click="downloadCsv(tableTitle, bannedAcnts)" push />
      </template>
      <template v-slot:header="props">
        <q-tr :props="props">
          <q-th class="text-center">index</q-th>
          <q-th v-for="col in props.cols.filter((col) => col.name !== 'ratingHistory' && col.name !== 'index')"
            :key="col.name" :props="props">
            {{ col.name }}
          </q-th>
          <q-th auto-width />
        </q-tr>
      </template>
      <template v-slot:body="props">
        <q-tr :props="props">
          <q-td v-for="col in props.cols.filter((col) => col.name !== 'ratingHistory')" :key="col.name" :props="props"
            :style="col.name === 'index' ? 'text-align:center' : ''">
            {{ col.name === 'index' ? props.rowIndex + 1 : col.value }}
          </q-td>
          <q-td auto-width>
            <q-icon :name="props.expand ? 'fa-solid fa-angle-up' : 'fa-solid fa-angle-down'" class="cursor-pointer"
              @click="props.expand = !props.expand" />
          </q-td>
        </q-tr>
        <q-tr v-show="props.expand" :props="props">
          <q-td colspan="100%" class="text-right">{{ props.row.ratingHistory }}</q-td>
        </q-tr>
      </template>
    </q-table>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useOperPanelStore } from 'src/stores/OperPanel';
import { useBanListStore } from 'src/stores/BanList';
import { downloadCsv } from 'src/utils/common';

const $q = useQuasar();
const operPanel = useOperPanelStore();
const banListStore = useBanListStore();
const bannedAcnts = ref([]);
const tableTitle = 'Auto banned account list';
const tableQuery = ref('');

watch(() => operPanel.reqNewData, async (v) => {
  if (v === 'BanList') {
    const result = await banListStore.reqBanList();

    if (result === null) $q.notify('There is no banned account');
    else if (result === undefined) $q.notify('Fail to get banned accounts');
    else bannedAcnts.value = result;
    operPanel.reqNewData = '';
  }
});

</script>
