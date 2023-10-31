import { defineStore } from 'pinia';
import axios from 'axios';
import { date } from 'quasar';

import { useAppConfigsStore } from './AppConfigs';

export const useNameHistoryStore = defineStore('NameHistory', () => {
  const { getDateDiff } = date;

  const appConfigs = useAppConfigsStore();

  function arrangeData(recs, queryConfig) {
    return {
      title: `[${appConfigs.servers[queryConfig.svr]}] ${queryConfig.name} naming history`,
      rows: Object.entries(recs).map(([acntId, info], index) => ({
        index,
        account: acntId,
        firstUseTime: info.First,
        lastUseTime: info.Last,
        useDays: getDateDiff(new Date(info.Last), new Date(info.First), 'days'),
        onlineTimes: info.counter,
      })),
    };
  }

  async function reqNameHistory(queryConfig) {
    try {
      const { svr, name } = queryConfig;
      const resData = (await axios.get(`${appConfigs.gameApiUrl}/NameHistory/svr${svr}-${name}.json`)).data;

      if (!Object.keys(resData || {}).length) return null;
      return arrangeData(resData, queryConfig);
    } catch (err) {
      console.log('[reqNameHistory] Error: ', err);
      return undefined;
    }
  }

  return { reqNameHistory };
});
