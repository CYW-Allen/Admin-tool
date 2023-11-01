import { defineStore } from 'pinia';
import axios from 'axios';

import { useAppConfigsStore } from './AppConfigs';

export const useBanListStore = defineStore('BanList', () => {
  const appConfigs = useAppConfigsStore();

  function arrangeData(recs) {
    return recs.map((rec, index) => ({
      index: index + 1,
      GID: rec.gid,
      role: rec.name,
      level: rec.lv,
      password: rec.pwd,
      lockTime: Object.keys(rec.lock || {})[0],
      score: Number(Object.values(rec.lock || {})[0] || 0).toFixed(3),
      ratingHistory: Object.entries(rec.sale).map((data) => data.join(': ')).join(', '),
    }));
  }

  async function reqBanList() {
    try {
      const resData = (await axios.get(`${appConfigs.gameApiUrl}/BanList/BanList.json`)).data;

      if (!(resData instanceof Array) || !resData.length) return null;
      return arrangeData(resData);
    } catch (err) {
      console.log('reqBanList', err);
      return undefined;
    }
  }

  return { reqBanList };
});
