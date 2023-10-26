import { defineStore } from 'pinia';
import { ref } from 'vue';
import { Notify } from 'quasar';
import axios from 'axios';

import { useAppConfigsStore } from './AppConfigs';
import { useOperPanelStore } from './OperPanel';

export const usePlayerInfosStore = defineStore('PlayerInfos', () => {
  const appConfigs = useAppConfigsStore();
  const operPanel = useOperPanelStore();

  const chartList = [
    { label: 'RoleInfos', value: 'info' },
    { label: 'Purchases', value: 'purchase' },
    { label: 'Consumption ranking by price', value: 'rankingByPrice' },
    { label: 'Consumption ranking by amount', value: 'rankingByAmount' },
    { label: 'Login history', value: 'loginHistory' },
  ];

  const ipListForLoc = ref([]);
  const mainDataIndex = ref(0);
  const cacheDeletedAlert = ref(false);
  const updateExistedDataAlert = ref(false);

  function extractActiveRecs(roles, purchaseRecs) {
    const activeRoles = roles.data.filter((role) => role.Name[0] !== '*');
    const activeRolesName = activeRoles.map((role) => role.Name);
    const activeRolesPurchaseRecs = purchaseRecs.data[0]
      ? purchaseRecs.data[0].purchase.filter((rec) => activeRolesName.indexOf(rec.buyer) !== -1)
      : [];

    return [activeRoles, activeRolesPurchaseRecs];
  }

  function arrangeData(roles, purchaseRec, acntIdInfos) {
    const result = { roles, purchase: {} };
    const ipList = Array.from(new Set(purchaseRec.map((rec) => rec.clientIP)));

    appConfigs.updateIpLocation(ipList)
      .then((ipLocation) => {
        const buyers = Object.keys(result.purchase);
        buyers.forEach((buyer) => {
          result.purchase[buyer].forEach((rec) => { rec.Location = ipLocation[rec.IP]; });
        });
      });
    result.roles.forEach((role) => {
      role.UID = {
        UID: acntIdInfos.UID,
        MID: acntIdInfos.MID,
        GID: role.UID[0].GID,
      };
    });
    result.roles = result.roles
      .sort((a, b) => b.level - a.level)
      .reduce((table, role) => {
        table[role.Name] = role;
        return table;
      }, {});
    purchaseRec?.forEach((rec) => {
      const row = {
        Id: rec.itemID,
        Name: rec.itemName,
        Unit_Price: rec.itemCost,
        Quantity: rec.itemQuantity,
        Total_Price: rec.itemPrice,
        Date: rec.modified_at_txt,
        IP: rec.clientIP,
        Location: rec.clientIP,
      };

      if (result.purchase[rec.buyer] !== undefined) result.purchase[rec.buyer].push(row);
      else result.purchase[rec.buyer] = [row];
    });
    return result;
  }

  async function reqPlayerInfos(queryConfig) {
    try {
      // const encodedName = encodeURIComponent(queryConfig.name);
      const [roles, purchaseRecs] = extractActiveRecs(...(await Promise.all([
        axios.get(`${appConfigs.gameApiUrl}/PlayerInfos/roles/svr${queryConfig.svr}-${queryConfig.name}.json`),
        axios.get(`${appConfigs.gameApiUrl}/PlayerInfos/purchase/svr${queryConfig.svr}-${queryConfig.name}.json`),
      ])));

      if (!roles.length) return null;
      await appConfigs.getAcntUid([roles[0].UID[0]]);
      return arrangeData(roles, purchaseRecs, appConfigs.acntIdInfo[roles[0].UID[0].GID]);
    } catch (err) {
      console.log('[reqPlayerInfos] Error: ', err);
      return null;
    }
  }

  function getChartConfig(obj, data, queryConfig) {
    switch (obj) {
      case 'rankingByPrice':
      case 'rankingByAmount':
        return {
          type: 'column',
          xaxisLabels: Object.keys(data),
          series: [{ name: obj === 'rankingByPrice' ? '$' : 'Amount', data: Object.values(data) }],
          clickEventHandler: {
            xAxisLabelClick(_event, _chartContext, cfg) {
              operPanel.delegateQuery = 'ItemPurchase';
              operPanel.autoSwitchFunc = true;
              operPanel.queryConfig = {
                svr: queryConfig.svr,
                name: cfg.config.xaxis.categories[cfg.labelIndex],
                time: operPanel.getDefaultPeriod(),
              };
              operPanel.curFunc = 'ItemPurchase';
            },
          },
        };
      case 'loginHistory':
        return {
          type: 'timeBar',
          series: [{
            data: data.map((rec) => ({
              x: 'OnlineTime',
              y: [new Date(rec.LoginTime).getTime(), new Date(rec.LogoutTime).getTime()],
            })),
          }],
        };
      default:
        return null;
    }
  }

  function getRoleInfoTable(oriData) {
    const newData = {};
    const output = { col: [], row: [] };

    try {
      oriData.forEach(([curDataKey, curDataVal]) => {
        switch (curDataKey) {
          case 'PVP':
          case 'StoreAsset':
          case 'StoreLock':
          case 'LoginLock':
            newData[curDataKey] = JSON.parse(
              JSON.stringify(curDataVal).replace(/\\u0000/g, ''),
            );
            break;
          case 'Mall':
            Object.entries(curDataVal.Overview).forEach((data) => {
              newData[data[0]] = data[1].toLocaleString();
            });
            break;
          case 'LoginHistory':
            break;
          case 'BAN':
            if (curDataVal.length === 0) newData.Status = 'Normal';
            else {
              const banInfo = curDataVal[0];

              if (Number(banInfo.hours) === 999) newData.Status = 'Permanently ban';
              else {
                const st = new Date(banInfo.StartTime);
                const fn = new Date(st.getTime() + Number(banInfo.hours) * 60 * 60000);

                newData.Status = fn > Date.now()
                  ? `Unlock ${curDataVal[0].Type} after ${fn.toLocaleString('zh-Hant')}`
                  : 'Normal';
              }
              newData.lockHistory = curDataVal.reduce((hist, rec) => {
                hist.push(
                  `${rec.Hour === 0 ? `Unlock ${rec.Type}` : `Lock ${rec.Type} ${rec.Hour === 999 ? 'forever' : `${rec.Hour} hours`}`}`
                  + ` from ${rec.StartTime}, Reason: ${rec.Reason}`,
                );
                return hist;
              }, []);
            }
            break;
          default:
            newData[curDataKey] = curDataVal === null || curDataVal.length === 0
              ? ''
              : curDataKey === 'Gold' || curDataKey === 'Dalant'
                ? curDataVal.toLocaleString() : curDataVal;
        }
      });

      output.col = ['prop', 'val'].map((field) => ({
        name: field,
        label: field,
        field,
        sortable: false,
        align: 'center',
        style: field === 'prop'
          ? 'width:30%;font-size:18px;font-weight:bold'
          : 'width:70%;font-size:16px;',
      }));
      output.row = Object.entries(newData).map((d) => ({ prop: d[0], val: d[1] }));
    } catch (err) {
      console.log('[getRoleInfoTable] Error: ', err);
      Notify.create('Fail to arrange role infos table');
    }
    return output;
  }

  function getPurchaseTable(records) {
    return {
      col: Object.keys(records || {}).length !== 0
        ? Object.keys(records[0] || {}).map((prop) => ({
          name: prop,
          label: prop,
          field: prop,
          sortable: prop !== 'Id' && prop !== 'Name',
          align: prop !== 'Id' && prop !== 'Name' ? 'left' : 'center',
          style: 'font-size:16px',
        })) : [],
      row: records || [],
    };
  }

  function getChartTable(type, roleInfo, oriData) {
    const titlePrefix = `[${roleInfo.svr}] ${roleInfo.name}`;
    const getColCfg = (cols, sortable) => cols.map((col) => ({
      name: col,
      label: col,
      field: col,
      sortable,
      align: 'left',
      style: 'font-size:16px;',
    }));

    switch (type) {
      case 'rankingByPrice':
      case 'rankingByAmount':
        return {
          title: `${titlePrefix} consumption ranking by ${type === 'rankingByPrice' ? 'price' : 'amount'}`,
          colCfg: getColCfg(['Ranking', 'ItemName', 'Value'], false),
          rowData: Object.entries(oriData).map(([prop, val], index) => ({
            Ranking: index + 1,
            ItemName: prop,
            Value: val.toLocaleString('zh-Hant'),
          })),
        };
      case 'loginHistory':
        ipListForLoc.value = [];
        return {
          title: `${titlePrefix} login history`,
          colCfg: getColCfg(['Login', 'Logout', 'OnlineMins', 'Level', 'IP', 'Location'], true),
          rowData: oriData.map((row, index) => {
            if (appConfigs.ipLocation[row.IP]) row.loc = appConfigs.ipLocation[row.IP];
            else {
              ipListForLoc.value.push([index, row.IP]);
              row.loc = row.IP;
            }
            return {
              Login: row.LoginTime,
              Logout: row.LogoutTime,
              OnlineMins: row.Period,
              Level: row.Level,
              IP: row.IP,
              Location: row.loc,
            };
          }),
        };
      default:
        return { title: '', colCfg: [], rowData: [] };
    }
  }

  class RoleData {
    constructor(queryConfig, roleInfos, purchaseRecs) {
      this.description = {
        name: roleInfos.Name,
        svr: appConfigs.servers[queryConfig.svr],
        race: roleInfos.Race,
      };
      this.chartConfig = {
        rankingByPrice: getChartConfig('rankingByPrice', roleInfos.Mall.RankingPrice[0], queryConfig),
        rankingByAmount: getChartConfig('rankingByAmount', roleInfos.Mall.RankingAmount, queryConfig),
        loginHistory: getChartConfig,
      };
      this.tableConfig = {
        info: getRoleInfoTable(Object.entries(roleInfos)),
        purchase: getPurchaseTable(purchaseRecs),
        rankingByPrice: getChartTable('rankingByPrice', this.description, roleInfos.Mall.RankingPrice[0]),
        rankingByAmount: getChartTable('rankingByAmount', this.description, roleInfos.Mall.RankingAmount),
        loginHistory: getChartTable('loginHistory', this.description, roleInfos.LoginHistory),
      };

      const ipList = Array.from(new Set(ipListForLoc.value.map((rec) => rec[1])));

      if (ipList.length) {
        appConfigs.updateIpLocation(ipList)
          .then((ipLocation) => {
            ipListForLoc.value.forEach(([index, ip]) => {
              this.tableConfig.loginHistory.rowData[index].Location = ipLocation[ip];
            });
          });
      }
    }
  }

  function getRoleDataInst(queryConfig, roleInfos, purchaseRecs) {
    return new RoleData(queryConfig, roleInfos, purchaseRecs);
  }

  return {
    chartList,
    mainDataIndex,
    cacheDeletedAlert,
    updateExistedDataAlert,
    reqPlayerInfos,
    getRoleDataInst,
  };
});
