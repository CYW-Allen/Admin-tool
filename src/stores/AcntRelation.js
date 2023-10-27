import { defineStore } from 'pinia';
import { ref } from 'vue';
import { Notify, date } from 'quasar';
import axios from 'axios';

import { useAppConfigsStore } from './AppConfigs';

export const useAcntRelationStore = defineStore('AcntRelation', () => {
  const appConfigs = useAppConfigsStore();

  const mainDataIndex = ref(0);
  const cacheDeletedAlert = ref(false);
  const updateExistedDataAlert = ref(false);

  function expandRolesMallProp(roles) {
    roles.forEach((role, roleIndex) => {
      Object.entries(role?.Mall?.Overview || {}).forEach(([key, val]) => {
        roles[roleIndex][key] = val;
      });
      delete roles[roleIndex].Mall;
    });
  }

  function getBanStatus(banHistory) {
    if (banHistory.length === 0) return 'normal';

    const latestBanRec = banHistory[0];

    if (Number(latestBanRec.Hour) === 999) return `Lock ${latestBanRec.Type} forever`;

    const curTime = new Date();
    const banFinTime = date.addToDate(new Date(latestBanRec.StartTime), { hours: Number(latestBanRec.Hour) });

    return banFinTime > curTime
      ? `${latestBanRec.Type} will be unlock after ${date.formatDate(banFinTime, 'YYYY/MM/DD HH:mm')}`
      : 'normal';
  }

  function moveEle2Head(arr, index) {
    const reqEle = arr[index];
    arr.splice(index, 1);
    arr.unshift(reqEle);
  }

  function moveCurAcnt2Start(acntList, curAcnt, svrId) {
    acntList.some(([, acntInfo], index) => {
      if (curAcnt.toLowerCase() === acntInfo.profile.GID.toLowerCase()) {
        console.log('curAcnt', curAcnt);
        console.log('GID', acntInfo.profile.GID);
        moveEle2Head(acntList, index);
        return true;
      }

      let isFound = false;
      acntInfo.roles.some((role) => {
        if (Number(role.server_id) === Number(svrId) && curAcnt.toLowerCase() === role.Name.toLowerCase()) {
          console.log('role', role);
          console.log('curAcnt', curAcnt);
          moveEle2Head(acntList, index);
          isFound = true;
        }
        return isFound;
      });
      return isFound;
    });
    return acntList;
  }

  function arrangeData(oriData, curAcnt, svr) {
    const acntList = Object.entries(oriData);
    const banAcnts = [];
    const unBanAcnts = [];

    acntList.forEach(([acntId, acntInfo]) => {
      if (acntInfo?.roles?.length) {
        expandRolesMallProp(acntInfo.roles);

        const curBanStatus = getBanStatus(acntInfo.roles[0].BAN);

        acntInfo.acBanStatus = curBanStatus;
        acntInfo.isBanned = curBanStatus.includes('account');
        acntInfo.roleSvrs = acntInfo.roles.reduce((result, role) => {
          if (!result.includes(role.server_id)) result.push(role.server_id);
          return result;
        }, []).map((index) => appConfigs.serverIndexTable[index + 1]);

        if (acntInfo.isBanned) banAcnts.push([acntId, acntInfo]);
        else unBanAcnts.push([acntId, acntInfo]);
      }
    });
    return moveCurAcnt2Start(unBanAcnts.concat(banAcnts), curAcnt, svr);
  }

  async function reqAcntRelation(queryConfig) {
    try {
      const { svr, name, time } = queryConfig;
      const resData = (await axios.get(`${appConfigs.gameApiUrl}/AcntRelation/`
        + `svr${svr}_${time.from || time}~${time.to || time}_${name}.json`)).data;
      const result = arrangeData(resData, name, svr);

      if (result.lenght === 0) Notify.create('There is no relations to this account');
      return result;
    } catch (err) {
      console.log('[reqAcntRelation] Error: ', err);
      Notify.create('Fail to get account relation');
      return null;
    }
  }

  return {
    mainDataIndex,
    cacheDeletedAlert,
    updateExistedDataAlert,
    reqAcntRelation,
  };
});
