import { defineStore } from 'pinia';
import axios from 'axios';

import { useAppConfigsStore } from './AppConfigs';

export const useItemPurchaseStore = defineStore('ItemPurchase', () => {
  const appConfigs = useAppConfigsStore();

  function getRowData(record, index) {
    return {
      Index: index,
      Server: appConfigs.servers[record.server_id],
      Buyer: record.role,
      Quantity: record.itemQuantity,
      Cost: record.itemPrice,
      Location: '',
      IP: record.clientIP,
      Time: record.modified_at_txt,
    };
  }

  function arrangeData(oriData, ipList) {
    return Object.entries(oriData.reduce((result, record, index) => {
      ipList[record.clientIP] = '';
      if (!result[record.itemName]) {
        result[record.itemName] = {
          overview: {
            ItemId: record.itemID,
            Price: record.itemCost,
            Quantity: record.itemQuantity,
            TotalCost: record.itemPrice,
          },
          rows: [getRowData(record, index + 1)],
        };
      } else {
        result[record.itemName].overview.Quantity += record.itemQuantity;
        result[record.itemName].overview.TotalCost += record.itemPrice;
        result[record.itemName].rows.push(getRowData(record, index + 1));
      }
      return result;
    }, {}))
      .sort(([, infoA], [, infoB]) => infoB.overview.TotalCost - infoA.overview.TotalCost)
      .reduce((result, [itemName, info]) => {
        result[itemName] = info;
        return result;
      }, {});
  }

  function fillChartConfig(itemName, rows) {
    const statistic = Object.entries(rows.reduce((result, row) => {
      result[`${row.Server}-${row.Buyer}`] = row.Quantity + (result[`${row.Server}-${row.Buyer}`] || 0);
      return result;
    }, {}))
      .sort(([, amountA], [, amountB]) => amountB - amountA)
      .slice(0, 10)
      .reduce((result, [name, amount]) => {
        result[name] = amount;
        return result;
      }, {});

    return {
      type: 'column',
      title: `[${itemName}] Purchase ranking`,
      xaxisLabels: Object.keys(statistic),
      isDistributed: true,
      series: [{ name: 'Amount', data: Object.values(statistic) }],
    };
  }

  async function reqItemPurchaseRecs(queryConfig) {
    const { name, svr, time } = queryConfig;
    const ipList = {};

    try {
      const resData = (await axios.get(
        `${appConfigs.gameApiUrl}/ItemPurchase/svr${svr}_${time.from || time}~${time.to || time}_${name}.json`,
      )).data;

      if (!(resData instanceof Array) || resData.length === 0) return { ipList, data: null };

      const result = arrangeData(resData, ipList);

      Object.entries(result).forEach(([itemName, itemRecs]) => {
        itemRecs.chartConfig = fillChartConfig(itemName, itemRecs.rows);
      });
      return { ipList, data: result };
    } catch (err) {
      console.log('[reqItemPurchaseRecs] Error: ', err);
      return { ipList, data: undefined };
    }
  }

  return { reqItemPurchaseRecs };
});
