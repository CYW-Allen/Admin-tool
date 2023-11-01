import { defineStore } from 'pinia';
import { date } from 'quasar';
import axios from 'axios';

import { useAppConfigsStore } from './AppConfigs';

export const useItemSellRankingStore = defineStore('ItemSellRanking', () => {
  const DAY_MINS = 24 * 60;
  const HOUR_MINS = 60;

  const appConfigs = useAppConfigsStore();

  function classifyItem(records) {
    return records.reduce((result, { name, item, count }) => {
      (result[item] ??= []).push([name, count]);
      return result;
    }, {});
  }

  function fillItemChartConfig(records) {
    return Object.entries(classifyItem(records)).reduce((result, [itemName, recs]) => {
      const xaxisLabels = [];
      const data = [];

      recs.sort(([, countA], [, countB]) => countB - countA)
        .slice(0, 10)
        .forEach(([player, count]) => {
          xaxisLabels.push(player);
          data.push(count);
        });

      result[itemName] = {
        type: 'column',
        title: `Selling ranking of ${itemName}`,
        xaxisLabels,
        isDistributed: true,
        series: [{ name: 'Amount', data }],
      };
      return result;
    }, {});
  }

  function getDuration(queryConfig) {
    const { days, hours, mins } = queryConfig.time;

    return Number(days) * DAY_MINS + Number(hours) * HOUR_MINS + Number(mins);
  }

  function getPeriodTimeStr(queryConfig) {
    const startTimeStr = date.formatDate(
      date.subtractFromDate(new Date(), { minutes: getDuration(queryConfig) }).getTime(),
      'YYYY/MM/DD HH:mm',
    );
    const endTimeStr = date.formatDate(Date.now(), 'YYYY/MM/DD HH:mm');

    return `${startTimeStr} ~ ${endTimeStr}`;
  }

  function arrangeData(recs, queryConfig) {
    const periodTimeStr = getPeriodTimeStr(queryConfig);

    return {
      periodTimeStr,
      tableConfig: {
        title: `[${appConfigs.servers[queryConfig.svr]}] Selling ranking`,
        rows: recs.sort((a, b) => b.count - a.count).map((row, index) => ({
          index,
          role: row.name,
          item: row.item,
          amount: row.count,
        })),
      },
      chartConfig: fillItemChartConfig(recs),
    };
  }

  async function reqItemSellRanking(queryConfig) {
    try {
      const resData = (await axios.get(
        `${appConfigs.gameApiUrl}/ItemSellRanking/svr${queryConfig.svr}-${getDuration(queryConfig)}.json`,
      )).data;

      if (!(resData instanceof Array) || !resData.length) return null;
      return arrangeData(resData, queryConfig);
    } catch (err) {
      console.log('[reqItemSellRanking] Error: ', err);
      return undefined;
    }
  }

  return {
    getPeriodTimeStr,
    reqItemSellRanking,
  };
});
