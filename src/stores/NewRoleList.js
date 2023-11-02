import { defineStore } from 'pinia';
import axios from 'axios';
import { date } from 'quasar';

import { useAppConfigsStore } from './AppConfigs';

export const useNewRoleListStore = defineStore('NewRoleList', () => {
  const appConfigs = useAppConfigsStore();

  function checkIfBan(acntInfo) {
    const banLog = acntInfo.block;

    if (!banLog.length) return false;
    if (banLog[0].hour === 999) return true;

    const curTime = new Date();
    const banStartT = new Date(banLog[0].startTime);

    return date.addToDate(banStartT, { hours: banLog[0].hour }) > curTime;
  }

  function arrangeData(recs) {
    const period = `${recs[recs.length - 1].created_at_txt.split(' ')[0]} ~ ${recs[0].created_at_txt.split(' ')[0]}`;
    const result = recs.reduce((collection, rec) => {
      (collection[rec.account] ??= { rows: [], isBanned: checkIfBan(rec) }).rows.push(rec);
      return collection;
    }, {});

    Object.keys(result).forEach((acnt) => {
      result[acnt].createCounts = result[acnt].rows.length;
      result[acnt].deleteCounts = result[acnt].rows.filter((row) => row.name[0] === '*').length;
    });

    const dataList = Object.entries(result);
    const normalAcnts = dataList.filter(([, infos]) => !infos.isBanned)
      .sort(([, infoA], [, infoB]) => infoB.createCounts - infoA.createCounts);
    const isBannedAcnts = dataList.filter(([, info]) => info.isBanned);
    const list = [...normalAcnts, ...isBannedAcnts];

    return {
      period,
      acntCounts: list.length,
      rolesCounts: list.reduce((sum, [, info]) => sum + info.rows.length, 0),
      list,
    };
  }

  async function reqNewRoleList(queryConfig) {
    try {
      const resData = (await axios.get(`${appConfigs.gameApiUrl}/NewRoleList/svr${queryConfig.svr}.json`)).data;

      if (!(resData instanceof Array && resData.length)) return null;
      return arrangeData(resData);
    } catch (err) {
      console.log('[reqNewRoleList] Error: ', err);
      return undefined;
    }
  }

  function getRelatQueryTime() {
    const dateFormat = 'YYYY-MM-DD';
    const curTime = new Date();

    return {
      from: date.formatDate(date.subtractFromDate(curTime, { days: 13 }), dateFormat),
      to: date.formatDate(curTime, dateFormat),
    };
  }

  return {
    reqNewRoleList,
    getRelatQueryTime,
  };
});
