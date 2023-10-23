import { defineStore } from 'pinia';
import axios from 'axios';
import { computed, ref } from 'vue';
import { getFontColorInBg, transIso2Country } from 'src/utils/common';
import { Notify } from 'quasar';

export const useAppConfigsStore = defineStore('AppConfigs', () => {
  const defaultConfigs = {
    gameApiUrl: process.env.GAME_URL,
    acntApiUrl: process.env.ACNT_URL,
    ipLocQueryUrl: process.env.IP_LOC_URL,
    servers: ['server1', 'server2', 'server3'],
    serversColor: ['#7B8078', '#557D78', '#C4AF8C'],
    races: ['A', 'B', 'C'],
    racesColor: {
      A: '#d47024',
      B: '#249111',
      C: '#2b9cff',
    },
  };
  const userConfigs = window.localStorage.getItem('appConfigs')
    ? JSON.parse(window.localStorage.getItem('appConfigs')) : undefined;

  const gameApiUrl = ref(userConfigs?.gameApiUrl || defaultConfigs.gameApiUrl);
  const acntApiUrl = ref(userConfigs?.acntApiUrl || defaultConfigs.acntApiUrl);
  const ipLocQueryUrl = ref(userConfigs?.ipLocQueryUrl || defaultConfigs.ipLocQueryUrl);

  const servers = ref(userConfigs?.servers || defaultConfigs.servers);
  const serversColor = ref(userConfigs?.serversColor || defaultConfigs.serversColor);
  const serverFontColor = computed(() => serversColor.value.map((svrColor) => getFontColorInBg(svrColor)));
  const serverIndexTable = computed(() => (
    ['All', ...servers.value].map((svr, index) => ({ label: svr, value: index - 1 }))
  ));

  const races = ref(userConfigs?.races || defaultConfigs.races);
  const racesColor = ref(
    userConfigs?.racesColor?.reduce((result, color, index) => {
      result[races.value[index]] = color;
      return result;
    }, {})
    || defaultConfigs.racesColor,
  );
  const raceFontColor = computed(() => racesColor.value.map((rColor) => getFontColorInBg(rColor)));

  const showSettingDlg = ref(false);

  const appFuncs = [
    { label: 'Dashboard', value: 'SvrDashBoard' },
    { label: 'Statistic', value: 'SvrStat' },
    { label: 'PlayerInfos', value: 'PlayerInfos' },
    { label: 'Account Relation', value: 'AcntRelation' },
    { label: 'ChipWar Records', value: 'ChipWar' },
    { label: 'Sale Records', value: 'ItemPurchase' },
    { label: 'PVP History', value: 'PvpHistory' },
    { label: 'Naming History', value: 'NameHistory' },
    { label: 'Selling Ranking', value: 'ItemSellRanking' },
    { label: 'Ban List', value: 'BanList' },
    { label: 'New Roles List', value: 'NewRoleList' },
  ];
  const queryCacheCount = 10;

  const ipLocation = ref({});

  async function updateIpLocation(ips) {
    try {
      const ipList = ips.filter((ip) => ipLocation.value[ip] === undefined);

      if (ipList.length) {
        const ipInfo = (await axios.post(ipLocQueryUrl.value, { ipList })).data;

        Object.entries(ipInfo).forEach(([ip, loc]) => {
          ipLocation.value[ip] = transIso2Country(loc);
        });
      }
    } catch (err) {
      console.log('[updateIpLocation] Error: ', err);
      Notify.create('Fail to get location of the ip');
    }
  }

  const acntIdInfo = ref({});

  async function getAcntUid(acntList) {
    const output = [];

    try {
      const resList = await (Promise.all(acntList.map((acnt) => acntIdInfo.value[acnt.GID]?.UID
        || axios.get(`${acntApiUrl.value}/gameid/?id=${acnt.GID}&p=RF&roles=0`))));

      resList.forEach((res, index) => {
        if (res.data !== undefined) {
          acntIdInfo.value[acntList[index].GID] = {
            UID: res.data[0].profile,
            MID: res.data[0].mid,
          };
          output.push(res.data[0].profile);
        } else output.push(res);
      });
    } catch (err) {
      console.log('[getAcntUid] Error: ', err);
      Notify.create('Fail to get uid of the account');
    }
    return output;
  }

  return {
    defaultConfigs,
    gameApiUrl,
    acntApiUrl,
    ipLocQueryUrl,
    servers,
    serversColor,
    serverFontColor,
    serverIndexTable,
    races,
    racesColor,
    raceFontColor,
    appFuncs,
    queryCacheCount,
    showSettingDlg,
    ipLocation,
    acntIdInfo,
    updateIpLocation,
    getAcntUid,
  };
});