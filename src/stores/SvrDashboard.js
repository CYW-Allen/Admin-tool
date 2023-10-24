import { defineStore } from 'pinia';
import { ref } from 'vue';
import { Notify } from 'quasar';
import axios from 'axios';
import { useAppConfigsStore } from './AppConfigs';

export const useSvrDashboard = defineStore('svrDashboard', () => {
  const appConfigs = useAppConfigsStore();

  const svrChartConfig = ref({});

  async function reqSvrInfo(svrId) {
    try {
      return {
        svrId,
        data: (await axios.get(`${appConfigs.gameApiUrl}/SvrDashboard/svr${svrId}.json`)).data,
      };
    } catch (err) {
      console.log('[reqSvrInfo] Error: ', err);
      Notify.create('Fail to get server data');
      return {};
    }
  }

  function getTableConfig(dates, records) {
    return {
      colCfg: ['Date', ...Object.keys(records[0])].map((col) => ({
        name: col,
        label: col,
        field: (row) => row[col],
        sortable: true,
        align: 'left',
        style: 'font-size:16px',
      })),
      rowData: dates.map((date, index) => ({
        Date: date,
        ...records[index],
      })),
    };
  }

  function generateChartConfig(svrInfo) {
    const chartConfigs = [];

    Object.keys(svrInfo.data).forEach((kind) => {
      const data = svrInfo.data[kind];
      const xaxisLabels = Object.keys(data);
      const dailyRecords = Object.values(data);
      const series = [
        { name: 'IP', type: 'line', data: [] },
        { name: 'DUP', type: 'line', data: [] },
        { name: 'DAU', type: 'area', data: [] },
      ];

      dailyRecords.forEach((record) => {
        series.forEach((s) => { s.data.push(record[s.name]); });
      });

      chartConfigs.push({
        kind: kind.toUpperCase(),
        type: 'dashboard',
        xaxisLabels,
        series,
        colors: ['#1a237e', '#1b5e20', '#ff6f00'],
        tableCfg: {
          title: `[${appConfigs.servers[svrInfo.svrId]}] ${kind.toUpperCase()} Chart`,
          ...getTableConfig(xaxisLabels, dailyRecords),
        },
      });
    });
    svrChartConfig.value[svrInfo.svrId] = chartConfigs;
  }

  async function processSvrInfo(svrId) {
    try {
      if (!(svrId in svrChartConfig.value)) {
        generateChartConfig(await reqSvrInfo(svrId));
      }
    } catch (err) {
      console.log('[reqSvrInfo] Error: ', err);
      Notify.create('Fail to get server infos');
    }
    return true;
  }

  return {
    svrChartConfig,
    processSvrInfo,
  };
});
