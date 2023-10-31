import { defineStore } from 'pinia';
import axios from 'axios';

import { getRandomHexColor } from 'src/utils/common';

import { useAppConfigsStore } from './AppConfigs';

export const useChipWarStore = defineStore('ChipWar', () => {
  const appConfigs = useAppConfigsStore();

  class ChipWarInfo {
    #queryConfig;
    #periods = [];
    #participantsInPeriod = {};
    #totalDmgOnChip = {};
    #racePlayerCounts = {};
    #raceDmgOnChip = {};
    #chartConfig = {
      playerCount: {}, damage: {}, chipDmgRanking: {}, pvpRanking: {},
    };
    #tableConfig = { damageHist: {}, pvpRanking: {} };

    get periods() { return this.#periods; }
    get participantsInPeriod() { return this.#participantsInPeriod; }
    get totalDmgOnChip() { return this.#totalDmgOnChip; }
    get racePlayerCounts() { return this.#racePlayerCounts; }
    get raceDmgOnChip() { return this.#raceDmgOnChip; }
    get chartConfig() { return this.#chartConfig; }
    get tableConfig() { return this.#tableConfig; }

    #initDataOfPeriod(period) {
      this.#participantsInPeriod[period] = {};
      this.#totalDmgOnChip[period] = {};
      this.#racePlayerCounts[period] = {};
      this.#raceDmgOnChip[period] = {};
    }

    #initDataOfChipRaceInPeriod(period, chipRace) {
      this.#totalDmgOnChip[period][chipRace] = 0;
      this.#racePlayerCounts[period][chipRace] = {};
      this.#raceDmgOnChip[period][chipRace] = {};
    }

    #getTotalRacePlayer(period, chipRace, playerRace) {
      this.#racePlayerCounts[period][chipRace][playerRace] = (this.#racePlayerCounts[period][chipRace][playerRace] || 0) + 1;
    }

    #getTotalRaceDmg(period, chipRace, roleRec) {
      this.#raceDmgOnChip[period][chipRace][roleRec.race] = (this.#raceDmgOnChip[period][chipRace][roleRec.race] || 0) + roleRec.dmg;
    }

    #fillChartConfig(period, chipRace) {
      const racePlayer = this.#racePlayerCounts[period][chipRace];
      const raceDmg = this.#raceDmgOnChip[period][chipRace];

      (this.#chartConfig.playerCount[period] ??= {})[chipRace] = {
        type: 'pie',
        title: `Headcounts of attacking C-${chipRace}`,
        colors: Object.keys(racePlayer).map((race) => appConfigs.racesColor[race]),
        xaxisLabels: Object.keys(racePlayer).map((race) => `P-${race}: `),
        series: Object.values(racePlayer),
      };
      (this.#chartConfig.damage[period] ??= {})[chipRace] = {
        type: 'pie',
        title: `Damage on C-${chipRace}`,
        colors: Object.keys(raceDmg).map((race) => appConfigs.racesColor[race]),
        xaxisLabels: Object.keys(raceDmg).map((race) => `P-${race}: `),
        series: Object.values(raceDmg),
      };
    }

    #fillChipDmgRankingChart(period, chipRace) {
      const dmgRecs = this.#tableConfig.damageHist[period][chipRace].rowData.slice(0, 10);
      if (!dmgRecs.length) return;

      const seriesColor = Array.from({ length: 2 }, () => getRandomHexColor());

      (this.#chartConfig.chipDmgRanking[period] ??= {})[chipRace] = {
        type: 'column',
        title: `Damage ranking of C-${chipRace}`,
        xaxisLabels: dmgRecs.map((rec) => rec.role),
        yaxis: [{
          serialName: 'damage',
          title: { text: 'Damage', style: { fontSize: '16px', color: seriesColor[0] } },
          labels: { formatter: (val) => new Intl.NumberFormat('zh-Hant', { notation: 'compact' }).format(val) },
        }, {
          serialName: 'dph',
          opposite: true,
          title: { text: 'DPH', style: { fontSize: '16px', color: seriesColor[1] } },
          labels: { formatter: (val) => new Intl.NumberFormat('zh-Hant', { notation: 'compact' }).format(val) },
        }],
        colors: seriesColor,
        isDistributed: false,
        series: [
          { name: 'damage', data: dmgRecs.map((rec) => rec.dmg) },
          { name: 'dph', data: dmgRecs.map((rec) => rec.DPH) },
        ],
      };
    }

    #fillPvpRankingChart(period, rawData) {
      const pvpRecs = Object.entries(rawData)
        .filter(([, pvpData]) => pvpData.K !== 0)
        .sort(([, a], [, b]) => b.K - a.K)
        .slice(0, 10);
      const seriesColors = Array.from({ length: 2 }, () => getRandomHexColor());
      const killSeries = [];
      const deathSeries = [];

      pvpRecs.forEach(([name, rec]) => {
        killSeries.push({
          x: name,
          y: rec.K,
          goals: [{ name: 'LV60up', value: rec.K60, strokeHeight: 5 }],
        });
        deathSeries.push({ x: name, y: rec.D });
      });

      this.#chartConfig.pvpRanking[period] = {
        type: 'column',
        title: 'PVP ranking',
        xaxisLabels: pvpRecs.map(([name]) => name),
        yaxis: [{
          seriesName: 'KillCounts',
          title: { text: 'KillCounts', style: { fontSize: '16px', color: seriesColors[0] } },
          labels: {
            style: { fontSize: '16px' },
            formatter: (val) => val.toFixed(0),
          },
        }, {
          seriesName: 'DeathCounts',
          title: { text: 'DeathCounts', style: { fontSize: '16px', color: seriesColors[1] } },
          opposite: true,
          labels: {
            style: { fontSize: '16px' },
            formatter: (val) => val.toFixed(0),
          },
        }],
        colors: seriesColors,
        isDistributed: false,
        series: [
          { name: 'KillCounts', data: killSeries },
          { name: 'DeathCounts', data: deathSeries },
        ],
      };
    }

    #fillTableConfig(period, chipRace, rowData) {
      const titlePrefix = `[${appConfigs.servers[this.#queryConfig.svr]}] ${this.#queryConfig.time}`;
      const indexCol = {
        name: 'index',
        label: 'ranking',
        field: 'index',
        align: 'center',
        style: 'font-size:16px',
      };

      if (chipRace !== 'KD') {
        (this.#tableConfig.damageHist[period] ??= {})[chipRace] = {
          title: `${titlePrefix} chip ${chipRace} under attack`,
          colCfg: rowData.length
            ? [indexCol, ...Object.keys(rowData[0] || {}).map((prop) => ({
              name: prop,
              label: prop,
              field: (row) => row[prop].toLocaleString('zh-Hant'),
              sortable: prop !== 'role',
              sort: (a, b) => (prop !== 'race'
                ? Number(b.replace(',', '')) - Number(a.replace(',', '')) : b.localeCompare(a)),
              align: prop !== 'role' ? 'left' : 'center',
              style: 'font-size:16px',
            }))] : [],
          rowData: rowData.sort((a, b) => b.dmg - a.dmg),
          queryConfig: { svr: this.#queryConfig.svr },
        };
      } else {
        rowData.sort((a, b) => b.killCounts - a.killCounts);
        this.#tableConfig.pvpRanking[period] = {
          title: `${titlePrefix} PVP ranking`,
          colCfg: rowData.length
            ? [indexCol, ...Object.keys(rowData[0]).map((prop) => ({
              name: prop,
              label: prop,
              field: prop,
              sortable: prop !== 'role',
              align: prop !== 'role' ? 'left' : 'center',
              style: 'font-size:16px',
            }))] : [],
          rowData,
          queryConfig: { svr: this.#queryConfig.svr },
        };
      }
    }

    #arrangeData(oriData) {
      this.#periods = Object.keys(oriData);
      Object.entries(oriData).forEach(([period, recsInPeriod]) => {
        this.#initDataOfPeriod(period);
        const participants = appConfigs.races.reduce((chips, chip) => {
          chips[chip] = [];
          return chips;
        }, {});

        Object.entries(recsInPeriod).forEach(([chipRace, recsOfRace]) => {
          let rowData = recsOfRace;

          if (chipRace !== 'KD') {
            this.#initDataOfChipRaceInPeriod(period, chipRace);
            recsOfRace.forEach((roleRec) => {
              this.#totalDmgOnChip[period][chipRace] += roleRec.dmg;
              this.#getTotalRacePlayer(period, chipRace, roleRec.race);
              this.#getTotalRaceDmg(period, chipRace, roleRec);
              roleRec.DPH = Math.floor(roleRec.dmg / roleRec.counter);
              participants[roleRec.race.toUpperCase()].push(roleRec.role);
            });
            this.#fillChartConfig(period, chipRace);
          } else {
            rowData = Object.entries(recsOfRace).map(([role, kdInfo]) => ({
              role,
              race: kdInfo.race,
              killCounts: kdInfo.K,
              killLv60Up: kdInfo.K60,
              deathCounts: kdInfo.D,
              kdValue: kdInfo.K - kdInfo.D,
            }));
          }
          this.#fillTableConfig(period, chipRace, rowData);
          if (chipRace !== 'KD') this.#fillChipDmgRankingChart(period, chipRace);
        });

        this.#fillPvpRankingChart(period, recsInPeriod.KD);
        this.#participantsInPeriod[period] = Object.entries(participants).reduce((result, [race, data]) => {
          result[race] = [...new Set(data)].length;
          return result;
        }, {});
      });
    }

    constructor(queryConfig, oriData) {
      this.#queryConfig = { ...queryConfig };
      this.#arrangeData(oriData);
    }

    updateChartRaceColor() {
      this.#periods.forEach((period) => {
        appConfigs.races.forEach((race) => {
          const playerCountChartCfg = this.#chartConfig.playerCount[period][race];
          const damageChartCfg = this.#chartConfig.damage[period][race];

          if (playerCountChartCfg) {
            this.#chartConfig.playerCount[period][race] = {
              ...playerCountChartCfg,
              colors: Object.keys(this.#racePlayerCounts[period][race]).map((r) => appConfigs.racesColor[r]),
            };
          }
          if (damageChartCfg) {
            this.#chartConfig.damage[period][race] = {
              ...damageChartCfg,
              colors: Object.keys(this.#raceDmgOnChip[period][race]).map((r) => appConfigs.racesColor[r]),
            };
          }
        });
      });
    }
  }

  async function reqChipWarStat(queryConfig) {
    try {
      const { svr, time } = queryConfig;
      const resData = (await axios.get(
        `${appConfigs.gameApiUrl}/ChipWar/svr${svr}_${time}.json`,
      )).data;

      return new ChipWarInfo(queryConfig, resData);
    } catch (err) {
      console.log('[reqChipWarStat] Error: ', err);
      return null;
    }
  }

  return { reqChipWarStat };
});
