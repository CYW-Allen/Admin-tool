import { defineStore } from 'pinia';
import axios from 'axios';

import { useAppConfigsStore } from './AppConfigs';

export const usePvpHistoryStore = defineStore('PvpHistory', () => {
  const appConfigs = useAppConfigsStore();

  function fillChartConfig(type, statistic, queryConfig) {
    const { svr, name } = queryConfig;
    const xaxisLabels = [];
    const data = [];
    Object.entries(statistic)
      .sort(([, aTimes], [, bTimes]) => bTimes - aTimes)
      .slice(0, 10)
      .forEach(([roleName, times]) => {
        xaxisLabels.push(roleName);
        data.push(times);
      });

    return {
      type: 'column',
      title: `[${appConfigs.servers[svr]}] ${name} - ${type} top10 ranking`,
      xaxisLabels,
      isDistributed: true,
      series: [{ name: 'Times', data }],
    };
  }

  function arrangeData(history, queryConfig) {
    const { svr, name } = queryConfig;
    const victims = {};
    const killRecs = [];
    const murderers = {};
    const murderedRecs = [];
    let killTimes = 0;
    let murderedTimes = 0;
    let curRoleLv = 0;

    history.forEach((rec) => {
      if (rec.KillerName === name) {
        curRoleLv = Math.max(rec.KillerLevel, curRoleLv);
        killTimes++;
        victims[rec.DierName] = (victims[rec.DierName] || 0) + 1;
        killRecs.push({
          index: killRecs.length + 1,
          role: rec.DierName,
          race: rec.DierClass,
          level: rec.DierLevel,
          time: rec.UpdateDate,
          map: rec.Map,
          coord: rec.Location,
        });
      } else {
        curRoleLv = Math.max(rec.DierLevel, curRoleLv);
        murderedTimes++;
        murderers[rec.KillerName] = (murderers[rec.KillerName] || 0) + 1;
        murderedRecs.push({
          index: murderedRecs.length + 1,
          role: rec.KillerName,
          race: rec.KillerClass,
          level: rec.KillerLevel,
          time: rec.UpdateDate,
          map: rec.Map,
          coord: rec.Location,
        });
      }
    });

    return {
      info: {
        name,
        race: history[0].KillerName === name
          ? history[0].KillerClass : history[0].DierClass,
        lv: curRoleLv,
        victimCounts: Object.keys(victims).length,
        killTimes,
        murdererCounts: Object.keys(murderers).length,
        murderedTimes,
      },
      tableTitle: {
        kill: `[${appConfigs.servers[svr]}] ${name} kill history`,
        murdered: `[${appConfigs.servers[svr]}] ${name} murdered history`,
      },
      recs: {
        kill: killRecs,
        murdered: murderedRecs,
      },
      chartConfig: {
        kill: fillChartConfig('victims', victims, queryConfig),
        murdered: fillChartConfig('murderer', murderers, queryConfig),
      },
    };
  }

  async function reqPvpHistory(queryConfig) {
    try {
      const { svr, time, name } = queryConfig;
      const resData = (await axios.get(`${appConfigs.gameApiUrl}/PvpHistory/svr${svr}-${time}-${name}.json`)).data;

      if (!(resData instanceof Array) || !resData.length) return null;
      return arrangeData(resData, queryConfig);
    } catch (err) {
      console.log('[reqPvpHistory] Error: ', err);
      return undefined;
    }
  }

  return { reqPvpHistory };
});
