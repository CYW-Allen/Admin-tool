import { defineStore } from 'pinia';
import { Notify } from 'quasar';
import axios from 'axios';
import { transformArr, getRandomHexColor } from 'src/utils/common';
import { useAppConfigsStore } from './AppConfigs';
import { useOperPanelStore } from './OperPanel';

export const useSvrStatStore = defineStore('SvrStat', () => {
  const appConfigs = useAppConfigsStore();
  const operPanel = useOperPanelStore();

  const sortObjData = (obj) => Object.entries(obj).sort(([, a], [, b]) => b - a);

  function processLevelData(originProp, resultProp, originData, result) {
    if (originData[originProp]) {
      const rowData = Object.entries(originData[originProp]);
      const categoryInLevel = ['dalant', 'gold', 'players'];

      rowData.forEach(([lv, data]) => {
        categoryInLevel.forEach((category) => {
          const racesCompleted = appConfigs.races.every((race) => data[race] !== undefined && data[race][category] !== undefined);

          if (racesCompleted) {
            const raceAmount = appConfigs.races.reduce((output, race) => {
              output[race] = data[race][category];
              return output;
            }, {});
            const levelNum = Number(lv.split('~')[0]);

            result.level[resultProp][category][levelNum] = raceAmount;
          }
        });
      });
    }
  }

  function arrangeData(originData, queryConfig) {
    const result = {
      level: {
        normal: {
          dalant: [],
          gold: [],
          players: [],
        },
        active: {
          dalant: [],
          gold: [],
          players: [],
        },
      },
      mall: {
        overview: {
          total: [],
          period: [],
        },
        ranking_quantity: [],
        ranking_price: [],
        ranking_player: {},
        ranking_consumption: [],
      },
      online: {},
    };

    [['level', 'normal'], ['level_active', 'active']].forEach(([originProp, resultProp]) => {
      processLevelData(originProp, resultProp, originData, result);
    });

    if (originData?.mall?.overview) {
      result.mall.overview.total = Object.entries(originData.mall.overview).map(([key, val]) => ({
        Property: key,
        Value: val.toLocaleString(),
      }));
    }

    if (originData?.mall?.period) {
      const originMallPeriodData = Object.values(originData.mall.period)[0];

      ['ranking_quantity', 'ranking_price', 'ranking_consumption'].forEach((prop) => {
        originMallPeriodData[prop] = sortObjData(originMallPeriodData[prop]);
      });
      originMallPeriodData.ranking_player = Object.entries(originMallPeriodData.ranking_player)
        .reduce((output, [item, rec]) => {
          output[item] = sortObjData(rec);
          return output;
        }, {});
      result.mall.overview.period = Object.entries(originMallPeriodData.overview).map(([key, val]) => ({
        Property: key,
        Value: val.toLocaleString(),
      }));
      delete originMallPeriodData.overview;
      Object.assign(result.mall, originMallPeriodData);
    }

    result.online = Object.entries(originData.online).reduce((output, [timeStr, data]) => {
      const [date, time] = timeStr.split(' ');

      if (output[date]) output[date].push({ time, ...data });
      else if (new Date(date) <= new Date(queryConfig.time.to || queryConfig.time)) {
        output[date] = [{ time, ...data }];
      }
      return output;
    }, {});
    return result;
  }

  async function reqSvrStat(queryConfig) {
    try {
      const { svr, time } = queryConfig;
      const res = await axios.get(
        `${appConfigs.gameApiUrl}/SvrStat/svr${svr}_${time.from || time}~${time.to || time}.json`,
      );

      return arrangeData(res.data, queryConfig);
    } catch (err) {
      console.log('[reqSvrStat] Error: ', err);
      Notify.create('Fail to get data');
      return null;
    }
  }

  function fillLevelTableCfg(config, levelRange) {
    const { min, max } = levelRange;
    const cols = ['players', 'gold', 'dalant'];

    config.tableCfg.title = `Level interval: ${min} ~ ${max}`;
    config.tableCfg.colCfg = ['race', ...cols].map((col) => ({
      name: col,
      label: col.toUpperCase(),
      field: (row) => row[col].toLocaleString('zh-hant'),
      sortable: false,
      align: 'center',
      style: 'font-size:14px',
    }));
    config.tableCfg.rowData = appConfigs.races.map((race) => ({
      race,
      ...(cols.reduce((result, col) => {
        result[col] = config[col].rowData !== null ? config[col].rowData[race] : 0;
        return result;
      }, {})),
    }));
  }

  function fillLevelChartCfg(config, statistic, levelRange) {
    ['players', 'gold', 'dalant'].forEach((kind) => {
      const rowData = statistic[kind]
        .slice(levelRange.min, levelRange.max + 1)
        .filter((data) => data !== undefined)
        .reduce((result, data) => {
          if (!result) result = { ...data };
          else Object.entries(data).forEach(([key, val]) => { result[key] += val; });
          return result;
        }, null);

      config[kind] = {
        type: 'pie',
        title: kind,
        colors: Object.values(appConfigs.racesColor),
        xaxisLabels: [...appConfigs.races],
        rowData,
        series: Object.values(rowData || {}),
      };
    });
    fillLevelTableCfg(config, levelRange);
  }

  function fillMallChartCfg(config, kind, statistic, chartViewerCfg, subItemOptions) {
    const [xaxisLabels, series] = transformArr(
      kind === 'ranking_player'
        ? statistic[kind][chartViewerCfg.viewSubItem || subItemOptions[0]]
        : statistic[kind],
    );

    config.chartOpts = {
      type: 'column',
      xaxisLabels,
      series: [{ name: 'amount', data: series }],
    };
    switch (chartViewerCfg.viewItem.mall) {
      case 'ranking_quantity':
        config.chartOpts.clickEventHandler = {
          xAxisLabelClick(_event, _chartContext, cfg) {
            operPanel.delegateQuery = 'ItemPurchase';
            operPanel.autoSwitchFunc = true;
            operPanel.queryConfig = {
              name: cfg.config.xaxis.categories[cfg.labelIndex],
              time: { ...config.tableCfg.queryConfig.time },
              svr: config.tableCfg.queryConfig.svr,
            };
            operPanel.curFunc = 'ItemPurchase';
          },
        };
        break;
      case 'ranking_price':
        config.chartOpts.clickEventHandler = {
          xAxisLabelClick(_event, _chartContext, cfg) {
            chartViewerCfg.viewItem.mall = 'ranking_player';
            chartViewerCfg.viewSubItem = subItemOptions[cfg.labelIndex];
          },
        };
        break;
      case 'ranking_player':
      case 'ranking_consumption':
        config.chartOpts.clickEventHandler = {
          xAxisLabelClick(_event, _chartContext, cfg) {
            operPanel.delegateQuery = 'PlayerInfos';
            operPanel.autoSwitchFunc = true;
            operPanel.queryConfig = {
              name: cfg.config.xaxis.categories[cfg.labelIndex],
              time: null,
              svr: config.tableCfg.queryConfig.svr,
            };
            operPanel.curFunc = 'PlayerInfos';
          },
        };
        break;
      default:
    }
  }

  function fillMallTableCfg(config, statistic, chartViewerCfg, subItemOptions) {
    const cols = ['Ranking', 'ObjName', 'Amount'];
    const data = chartViewerCfg.viewItem.mall === 'ranking_player'
      ? statistic.ranking_player[chartViewerCfg.viewSubItem || subItemOptions[0]]
      : statistic[chartViewerCfg.viewItem.mall];

    config.tableCfg.title = `${chartViewerCfg.viewItem.mall.split('_')[1]} ranking`;
    config.tableCfg.colCfg = cols.map((col) => ({
      name: col,
      label: col,
      field: (row) => row[col].toLocaleString('zh-Hant'),
      sortable: false,
      align: 'center',
      style: 'font-size:16px',
    }));
    config.tableCfg.rowData = data.map((row, index) => ({
      Ranking: index + 1,
      ...row.reduce((result, fieldVal, rowIndex) => {
        result[cols[rowIndex + 1]] = fieldVal;
        return result;
      }, {}),
    }));
  }

  function fillOnlineChartCfg(config, statistic) {
    const rowProps = Object.keys(statistic[0]).filter((e) => e !== 'time');

    config.chartOpts = {
      type: 'mixed',
      xaxisLabels: statistic.map((data) => data.time),
      colors: rowProps.map((prop) => appConfigs.racesColor[prop] || getRandomHexColor()),
      series: rowProps.map((prop) => ({
        name: prop,
        type: appConfigs.races.includes(prop) ? 'column' : 'line',
        data: statistic.map((data) => data[prop]),
      })),
    };
  }

  function fillOnlineTableCfg(config, statistic, chartViewerCfg) {
    const dailyRecProps = Object.keys(Object.values(statistic)[0][0]);

    config.tableCfg.title = `Online players in ${chartViewerCfg.viewItem.online}`;
    config.tableCfg.colCfg = dailyRecProps.map((prop) => ({
      name: prop,
      label: prop,
      field: prop,
      sortable: true,
      align: 'left',
      style: 'font-size:16px',
    }));
    config.tableCfg.rowData = statistic[chartViewerCfg.viewItem.online];
  }

  return {
    reqSvrStat,
    fillLevelChartCfg,
    fillMallChartCfg,
    fillMallTableCfg,
    fillOnlineChartCfg,
    fillOnlineTableCfg,
  };
});
