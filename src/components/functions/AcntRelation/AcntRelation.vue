<template>
  <div class="fit column q-pa-sm" v-if="cacheDataInfos.length > 0">
    <div class="row">
      <q-btn-group glossy square>
        <q-btn :color="!selectAllUnban ? 'grey' : 'positive'" :glossy="selectAllUnban" label="Select all"
          @click="toggleSelectAll" />
        <q-btn color="negative" icon="fa-solid fa-lock" label="Batch lock" :disable="selections.length === 0"
          @click="confirmBanUnban" />
      </q-btn-group>
      <q-select class="col text-subtitle1" bg-color="indigo-2" popup-content-class="text-subtitle1" outlined
        v-model="curCacheIndex" :options="cacheDataOpts" emit-value map-options square dense>
        <template v-slot:prepend>
          <div class="text-subtitle1 text-blue-10">Query history :</div>
        </template>
      </q-select>
      <q-btn glossy square color="primary" icon="fa-solid fa-file-export" title="Export data" @click="exportData" />
    </div>

    <div class="col row wrap" style="overflow: auto;">
      <div class="col full-height compMinWidth" style="overflow-y: auto;">
        <q-virtual-scroll ref="virtualScrollArea" class="full-height" :items="curCacheData.content"
          virtual-scroll-slice-size="20" separator>
          <template v-slot="{ item, index }">
            <q-expansion-item :key="`acnt-${index}`" :id="`data-${curCacheIndex}-acnt-${item[0]}`" class="acListexpItem"
              expand-separator expand-icon-class="text-purple">
              <template v-slot:header>
                <div class="fit row">
                  <div class="col row justify-center items-center">
                    <q-checkbox v-if="!item[1].isBanned" v-model="selections" :val="item[1]"
                      @update:model-value="selectAllUnban = false" />
                  </div>
                  <q-item-section class="col-7">
                    <div class="text-subtitle1" style="width: 100%">
                      <div class="row justify-start items-center">
                        <q-icon v-if="index === 0" name="fa-solid fa-star" color="orange" />
                        <q-icon class="q-ml-sm" v-if="item[1].isBanned" name="fa-solid fa-lock" color="red" />
                        <span :class="`text-h6 text-bold ${item[1].isBanned ? 'text-red' : ''}`">
                          {{ `&nbsp;${acntMainRole[index].name}` }}
                        </span>
                        <q-icon class="q-ml-sm" size="sm" v-if="curFocusAcnt === item[0]" name="fa-solid fa-eye" />
                      </div>
                      <div class="row q-mt-sm">
                        <div class="col glossy rounded-borders row justify-center items-center q-mr-sm text-no-wrap"
                          :style="`background-color: ${appConfigs.serversColor[acntMainRole[index].svrId]};color: ${appConfigs.serverFontColor[acntMainRole[index].svrId]}`">
                          {{ acntMainRole[index].svr }}
                        </div>
                        <div class="col glossy rounded-borders row justify-center items-center q-mr-sm text-no-wrap"
                          :style="`background-color: ${appConfigs.serversColor[acntMainRole[index].svrId]};color: ${appConfigs.serverFontColor[acntMainRole[index].svrId]}`">
                          {{ `Lv: ${acntMainRole[index].lv}` }}
                        </div>
                        <div class="col-3 glossy rounded-borders row justify-center items-center q-mr-sm text-no-wrap"
                          :style="`background-color: ${appConfigs.serversColor[acntMainRole[index].svrId]};color: ${appConfigs.serverFontColor[acntMainRole[index].svrId]}`">
                          {{ `Topup: ${acntMainRole[index].topup}` }}
                        </div>
                        <div class="col-3 glossy rounded-borders row justify-center items-center q-mr-sm text-no-wrap"
                          :style="`background-color: ${appConfigs.serversColor[acntMainRole[index].svrId]};color: ${appConfigs.serverFontColor[acntMainRole[index].svrId]}`">
                          {{ `Bonus: ${acntMainRole[index].bonus}` }}
                        </div>
                        <div class="col glossy rounded-borders row justify-center items-center q-mr-sm text-no-wrap"
                          :style="`background-color: ${appConfigs.serversColor[acntMainRole[index].svrId]};color: ${appConfigs.serverFontColor[acntMainRole[index].svrId]}`">
                          {{ `IP: ${item[1].ip.length}` }}
                        </div>
                      </div>
                    </div>
                  </q-item-section>
                  <q-item-section class="col-2">
                    <div class="fit row wrap">
                      <div v-for="(r, ri) in racesInAcnt[index]" :key="`acnt-race-${ri}`"
                        class="col-3 row justify-center items-center" style="margin: 2px;">
                        <q-avatar square class="glossy fit" font-size="1rem" :style="`background-color: ${r.bgColor};`"
                          :text-color="r.fontColor">
                          {{ r.race }}
                        </q-avatar>
                      </div>
                    </div>
                  </q-item-section>
                  <q-item-section class="col row justify-center items-center">
                    <q-btn padding="10px" style="line-height: 1" size="md"
                      :icon="item[1].isBanned ? 'fa-solid fa-lock-open' : 'fa-solid fa-lock'"
                      :color="item[1].isBanned ? 'positive' : 'negative'" glossy @click.stop="banUnbanAcnt(item[1])" />
                  </q-item-section>
                </div>
              </template>
              <q-expansion-item header-class="text-subtitle1 q-ml-lg q-pl-lg" :content-inset-level="1">
                <template v-slot:header>
                  <div class="fit">
                    <q-icon size="sm" name="fa-solid fa-location-dot" />
                    <span class="q-mx-lg">Used ip</span>
                    <span class="q-mx-sm" v-for="stat, ipLocIndex in item[1].top3IpLoc"
                      :key="`${item[0]}-top3IpLoc-${ipLocIndex}`">
                      {{ stat.join(': ') }}
                    </span>
                  </div>
                </template>
                <div style="max-height: 150px; overflow-y: auto">
                  <q-list>
                    <q-item v-for="(ip, ipIndex) in item[1].ip" :key="`ip-${ipIndex}`">
                      <q-item-section>
                        <q-item-label>{{ ip }}</q-item-label>
                      </q-item-section>
                      <q-item-section v-if="!appConfigs.ipLocation[ip[0] === '*' ? ip.slice(1) : ip]">
                        <q-spinner-dots color="primary" size="2em" />
                      </q-item-section>
                      <q-item-section v-else>
                        <div class="text-indigo text-right" style="max-width: 80%">
                          {{ appConfigs.ipLocation[ip[0] === "*" ? ip.slice(1) : ip] }}
                        </div>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </div>
              </q-expansion-item>
              <q-expansion-item header-class="text-subtitle1 q-ml-lg q-pl-lg" :content-inset-level="1">
                <template v-slot:header>
                  <div class="fit">
                    <q-icon size="sm" name="fa-solid fa-user" />
                    <span class="q-mx-lg">Roles</span>
                    <div v-if="!singleBlock" style="display: inline-block;">
                      <q-btn-group push glossy>
                        <q-btn v-for="svr in item[1].roleSvrs" :key="`acnt${item[0]}${svr.label}`" :data-svr="svr.value"
                          :style="`background:${appConfigs.serversColor[svr.value]};color:${appConfigs.serverFontColor[svr.value]}`"
                          :label="svr.label" @click.stop="getAcntDetail({
                            name: item[1].profile.GID,
                            svr: svr.value,
                          }, item[0])" />
                      </q-btn-group>
                    </div>
                  </div>
                </template>
                <q-list>
                  <q-item v-for="(role, roleIndex) in item[1].roles" :key="`${item[0]}-roleinfo-${roleIndex}`" dense
                    :style="`background-color: ${appConfigs.serversColor[role.server_id]};`">
                    <q-item-section no-wrap>
                      <q-item-label class="text-subtitle1 row"
                        :style="`color: ${appConfigs.serverFontColor[role.server_id]}`">
                        <div class="col-3 row justify-start items-center">
                          <span class="col text-center">{{ `[${role.Race}]` }}</span>
                          <span class="col-3 text-center">{{ `Lv ${role.Level}` }}</span>
                          <span class="col-8">{{ `${role.Name}` }}</span>
                        </div>
                        <div class="col-3 row justify-start items-center">
                          {{ `D: ${role.Dalant.toLocaleString()}` }}
                        </div>
                        <div class="col-3 row justify-start items-center">
                          {{ `G: ${role.Gold.toLocaleString()}` }}
                        </div>
                        <div class="col-3 row justify-start items-center">
                          {{ `Spend: ${role.Spend.toLocaleString()}` }}
                        </div>
                      </q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-expansion-item>
            </q-expansion-item>
          </template>
        </q-virtual-scroll>
      </div>
      <q-separator inset vertical />
      <div v-if="!singleBlock" class="col full-height compMinWidth">
        <acntDetail v-if="detailExisted" :query-config="detailQueryConfig" :single-block="true"
          :caller="'AcntRelation'" />
        <div v-else class="fit row justify-center items-center text-h6 text-bold">
          Click button in "Role" Field to get account detail
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAppConfigsStore } from 'src/stores/AppConfigs';
import { useOperPanelStore } from 'src/stores/OperPanel';
import { usePlayerInfosStore } from 'src/stores/PlayerInfos';
import { useAcntRelationStore } from 'src/stores/AcntRelation';
import { useQuasar } from 'quasar';
import {
  computed, nextTick, ref, watch,
} from 'vue';
import acntDetail from '../PlayerInfos/PlayerInfos.vue';

const appConfigs = useAppConfigsStore();
const operPanel = useOperPanelStore();
const playerInfos = usePlayerInfosStore();
const acntRelation = useAcntRelationStore();
const $q = useQuasar();

const props = defineProps({
  singleBlock: {
    type: Boolean,
  },
  queryConfig: {
    type: Object,
  },
  caller: {
    type: String,
  },
});

function getCacheLabel(config) {
  return `[${appConfigs.servers[config.svr]}]`
    + ` ${config.time.from || config.time}`
    + ` ~ ${config.time.to || config.time}`
    + ` - ${config.name}`;
}

const virtualScrollArea = ref(null);
const compCaller = ref(props.caller || 'AcntRelation');
const cacheDataInfos = ref([]);
const curCacheIndex = ref(0);
const curCacheData = computed(() => cacheDataInfos.value[curCacheIndex.value]);
const cacheDataOpts = computed(() => cacheDataInfos.value.map((info, index) => ({
  label: getCacheLabel(info.queryConfig),
  value: index,
})));
const acntMainRole = computed(() => (
  cacheDataInfos.value[curCacheIndex.value].content.map(([, acntInfo]) => {
    const roleList = acntInfo.roles.sort((a, b) => Number(b.Level) - Number(a.Level));
    return {
      svr: appConfigs.servers[roleList[0].server_id],
      svrId: roleList[0].server_id,
      name: roleList[0].Name,
      lv: roleList[0].Level,
      topup: roleList[0].TotalTopup,
      bonus: roleList[0].TotalBonus,
    };
  })
));
const racesInAcnt = computed(() => (
  Array.from({ length: curCacheData.value?.content?.length || 0 }, (__, rowIndex) => {
    const RACE_OF_EMPTY_SLOT = '~';
    const acntRaceList = Array.from(
      { length: appConfigs.servers.length },
      (_, index) => Array(appConfigs.races.length).fill({
        race: RACE_OF_EMPTY_SLOT,
        bgColor: appConfigs.serversColor[index],
        fontColor: 'transparent',
      }),
    );

    curCacheData.value.content[rowIndex][1].roles.forEach((roleInfo) => {
      acntRaceList[roleInfo.server_id].unshift({
        race: roleInfo.Race,
        bgColor: appConfigs.serversColor[roleInfo.server_id],
        fontColor: appConfigs.serverFontColor[roleInfo.server_id] === '#000000' ? 'black' : 'white',
      });
      acntRaceList[roleInfo.server_id].pop();
    });
    acntRaceList.forEach((list) => {
      list.sort((a, b) => a.race.charCodeAt(0) - b.race.charCodeAt(0));
    });
    return acntRaceList.reduce((list, svrRaces) => {
      list.push(...svrRaces);
      return list;
    }, []);
  })
));

const selections = ref([]);
const selectAllUnban = ref(false);

function toggleSelectAll() {
  selectAllUnban.value = !selectAllUnban.value;
  if (selectAllUnban.value) {
    selections.value = cacheDataInfos.value[curCacheIndex.value].content
      .filter((acntInfo) => !acntInfo[1].isBanned)
      .map(([, acntInfo]) => acntInfo);
  } else {
    selections.value = [];
    operPanel.banBatches = null;
  }
}

async function exportData() {
  let fileContent = 'uid,gid,status,roleList\n';
  const { queryConfig, content } = curCacheData.value;
  const acntInfoList = content.map(([, acntInfo]) => acntInfo);
  const uidList = await appConfigs.getAcntUid(acntInfoList.map((acntInfo) => acntInfo.profile));

  acntInfoList.forEach((info, index) => {
    let row = `${uidList[index] || 'undefined'},${info.profile.GID},${info.acBanStatus}`;

    info.roles.forEach((role) => { row += `,${role.Name}`; });
    row += '\n';
    fileContent += row;
  });

  const downloader = document.createElement('a');
  downloader.href = `data:text/csv;charseet=utf-8,${encodeURIComponent(`\uFEFF${fileContent}`)}`;
  downloader.target = '_blank';
  downloader.download = `${getCacheLabel(queryConfig)} relation.csv`;
  downloader.click();
}

async function confirmBanUnban() {
  operPanel.banBatches = selections.value.map((acnt) => ({
    action: acnt.isBanned ? 'unban' : 'ban',
    GID: acnt.profile.GID,
    name: acnt.roles[0].Name,
    acntSN: acnt.profile.AccountSerial,
  }));
  const uidList = await appConfigs.getAcntUid(operPanel.banBatches);
  uidList.forEach((uid, index) => {
    operPanel.banBatches[index].UID = uid;
  });

  if (uidList.length > 0) {
    operPanel.banIsProcessing = true;
    operPanel.banDlgShow = true;
  }
}

function banUnbanAcnt(acnt) {
  selections.value = [acnt];
  confirmBanUnban();
}

const curFocusAcnt = ref('');
const detailQueryConfig = ref(null);
const queryAcntHist = ref([]);
const detailExisted = ref(false);

async function scrollToCurFocusAcnt() {
  const { relateHistIndex, relateObjIndex, relateDetailObj } = queryAcntHist.value[playerInfos.mainDataIndex];

  if (relateHistIndex !== curCacheIndex.value) {
    curCacheIndex.value = relateHistIndex;
    await nextTick();
  }
  curFocusAcnt.value = relateDetailObj;
  virtualScrollArea.value.scrollTo(relateObjIndex, 'center');
}

async function getAcntDetail(queryConfig, focusAcnt) {
  detailQueryConfig.value = queryConfig;
  queryAcntHist.value.push({
    relateHistIndex: curCacheIndex.value,
    relateObjIndex: curCacheData.value.content.findIndex((acnt) => acnt[0] === focusAcnt),
    relateDetailObj: focusAcnt,
  });
  curFocusAcnt.value = focusAcnt;
  detailExisted.value = true;
  await nextTick();

  operPanel.reqNewData = 'PlayerInfos';
}

async function execQueryReq(queryConfig) {
  const curQueryLabel = getCacheLabel(queryConfig);
  const existedDataIndex = cacheDataOpts.value.findIndex((opt) => opt.label === curQueryLabel);
  const result = await acntRelation.reqAcntRelation(queryConfig);

  if (result && result.length) {
    const dataObj = {
      queryConfig: {
        svr: queryConfig.svr,
        time: queryConfig.time,
        name: queryConfig.name,
      },
      content: result,
    };

    if (existedDataIndex === -1) cacheDataInfos.value.push(dataObj);
    else cacheDataInfos.value[existedDataIndex] = dataObj;
    if (cacheDataInfos.value.length > appConfigs.queryCacheCount) cacheDataInfos.value.shift();
    if (existedDataIndex === -1) curCacheIndex.value = cacheDataInfos.value.length - 1;
    else {
      curCacheIndex.value = existedDataIndex;
      acntRelation.updateExistedDataAlert = true;
    }

    const ipList = [];

    result.forEach(([, acntInfo]) => {
      ipList.push(...acntInfo.ip.map((ip) => (ip[0] === '*' ? ip.slice(1) : ip)));
    });

    appConfigs.updateIpLocation(ipList)
      .then(() => {
        curCacheData.value.content.forEach(([, acntInfo]) => {
          acntInfo.top3IpLoc = Object.entries(
            acntInfo.ip.reduce((statistic, ip) => {
              const loc = appConfigs.ipLocation[ip[0] === '*' ? ip.slice(1) : ip];
              if (statistic[loc]) statistic[loc] += 1;
              else statistic[loc] = 1;
              return statistic;
            }, {}),
          )
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);
        });
      });
  }
}

watch(() => operPanel.reqNewData, async (v) => {
  if (v === 'AcntRelation' && compCaller.value === operPanel.curFunc) {
    operPanel.preparing = true;
    await execQueryReq(props.queryConfig || operPanel.queryConfig);
    operPanel.reqNewData = '';
    operPanel.preparing = false;
  }
});

watch(curCacheIndex, (v) => {
  selections.value = [];
  selectAllUnban.value = false;
  acntRelation.mainDataIndex = v;
});

watch(() => playerInfos.mainDataIndex, () => {
  if (operPanel.curFunc === 'AcntRelation') scrollToCurFocusAcnt();
});
watch(() => playerInfos.cacheDeletedAlert, (v) => {
  if (v && operPanel.curFunc === 'AcntRelation') {
    queryAcntHist.value.shift();
    playerInfos.cacheDeletedAlert = false;
  }
});
watch(() => playerInfos.updateExistedDataAlert, (v) => {
  if (v && operPanel.curFunc === 'AcntRelation') {
    queryAcntHist.value.pop();
    playerInfos.updateExistedDataAlert = false;
  }
});
watch(() => operPanel.refreshData, async (v) => {
  if (v) {
    const refreshCacheList = cacheDataInfos.value.filter((info) => (
      info.content.some(([acntId]) => operPanel.banAcntIds.includes(acntId))
    ));

    try {
      await Promise.all(refreshCacheList.map((req) => execQueryReq(req.queryConfig)));
      queryAcntHist.value.forEach((hist) => {
        hist.relateObjIndex = curCacheData.value.content.findIndex((acnt) => acnt[0] === hist.relateDetailObj);
      });

      $q.notify({
        type: 'positive',
        icon: 'fa-regular fa-circle-check',
        message: 'Success to refresh the relation',
      });
    } catch (err) {
      console.log('[AcntRelation] refresh err: ', err);
      $q.notify('Fail to refresh the relation');
    }

    operPanel.banBatches = [];
    operPanel.refreshData = false;
  }
});
</script>
