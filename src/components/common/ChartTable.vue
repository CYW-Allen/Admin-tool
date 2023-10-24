<template>
  <q-dialog v-model="operPanel.tableDlgShow">
    <q-card class="tableDialog" style="width: 60vw; max-width: none" @click="viewDetail">
      <q-table class="sticky-header-row" :title="operPanel.tableConfig.title" :columns="operPanel.tableConfig.colCfg"
        :rows="operPanel.tableConfig.rowData" separator="vertical" virtual-scroll :pagination="{ rowsPerPage: 0 }"
        :rows-per-page-options="[0]" :virtual-scroll-sticky-size-start="48" hide-bottom :filter="filter">
        <template v-slot:top-right>
          <q-input v-model="filter" type="text" class="q-mr-md" dense debounce="500" placeholder="Query...">
            <template v-slot:prepend>
              <q-icon name="fa-solid fa-magnifying-glass" />
            </template>
          </q-input>
          <q-btn class="glossy text-subtitle1" color="grey-8" icon="fa-solid fa-download"
            @click="downloadCsv(operPanel.tableConfig.title, operPanel.tableConfig.rowData)" push />
        </template>
        <template v-slot:body-cell-index="props">
          <q-td class="text-center">{{ props.rowIndex + 1 }}</q-td>
        </template>
        <template v-slot:body-cell-Item="props">
          <td>
            <span class="item cursor-pointer" style="color:blue;text-decoration: underline;">{{ props.value }}</span>
          </td>
        </template>
        <template v-slot:body-cell-Role="props">
          <td>
            <span class="role cursor-pointer" style="color:blue;text-decoration: underline;">{{ props.value }}</span>
          </td>
        </template>
      </q-table>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref } from 'vue';
import { useOperPanelStore } from 'src/stores/OperPanel';
import { downloadCsv } from 'src/utils/common';

const operPanel = useOperPanelStore();
const filter = ref('');

function viewDetail(event) {
  if (event.target.matches('.role')) {
    operPanel.delegateQuery = 'PlayerInfos';
    operPanel.autoSwitchFunc = true;
    operPanel.queryConfig = {
      svr: operPanel.tableConfig.queryConfig.svr || 0,
      name: event.target.textContent,
      time: null,
    };
    operPanel.curFunc = 'PlayerInfos';
    operPanel.tableDlgShow = false;
  } else if (event.target.matches('.item')) {
    operPanel.delegateQuery = 'ItemPurchase';
    operPanel.autoSwitchFunc = true;
    operPanel.queryConfig = {
      svr: operPanel.tableConfig.queryConfig.svr || 0,
      name: event.target.textContent,
      time: operPanel.tableConfig.queryConfig.time || operPanel.getDefaultPeriod(),
    };
    operPanel.curFunc = 'ItemPurchase';
    operPanel.tableDlgShow = false;
  }
}
</script>
