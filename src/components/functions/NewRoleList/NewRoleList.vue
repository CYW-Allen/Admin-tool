<template>
  <div class="fit column" v-if="cacheDataInfos.length > 0">
    <q-select class="text-subtitle1" bg-color="indigo-2" popup-content-class="text-subtitle1" outlined
      v-model="curCacheIndex" :options="cacheDataOpts" emit-value map-options square dense>
      <template v-slot:prepend>
        <div class="text-subtitle1 text-blue-10">Query history :</div>
      </template>
    </q-select>

    <q-field bg-color="green-2" filled dense>
      <template v-slot:control>
        <div class="fit row justify-around items-center text-h6 text-bold">
          <span class="col-auto">
            Period :
            <span class="q-ml-sm text-indigo-10">{{ curCacheData.period }}</span>
          </span>
          <span class="col-auto">
            Accounts :
            <span class="q-ml-sm text-purple-10">{{ curCacheData.acntCounts }}</span>
          </span>
          <span class="col-auto">
            Roles :
            <span class="q-ml-sm text-red-10">{{ curCacheData.rolesCounts }}</span>
          </span>
        </div>
      </template>
    </q-field>

    <div class="col row" style="overflow: auto;" @click="viewAcntDetail">
      <div class="col full-height compMinWidth" style="overflow-y: auto;">
        <q-virtual-scroll ref="virtualScrollArea" class="fit" :items="curCacheData.list" separator>
          <template v-slot="{ item }">
            <q-expansion-item expand-separator expand-icon-class="text-indigo">
              <template v-slot:header>
                <q-item-section no-wrap>
                  <q-item-label class="row no-wrap q-pa-none">
                    <div :class="`col-4 text-h6 text-bold ${item[1].isBanned ? 'text-strike text-red' : ''}`">
                      <span class="text-indigo-10 acntId" title="view acnt data" style="text-decoration: underline;">
                        {{ item[0] }}
                      </span>
                      <q-icon class="q-ml-sm" size="sm" v-if="curDetailAcnt === item[0]" name="fa-solid fa-eye" />
                    </div>
                    <div class="col-8 text-subtitle1 row no-wrap justify-start items-center">
                      <span class="col">{{ `Creations: ${item[1].createCounts}` }}</span>
                      <span class="col">{{ `Deletions: ${item[1].deleteCounts}` }}</span>
                    </div>
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-btn glossy push class="q-pt-sm q-px-sm relatBtn" size="md" icon="fa-solid fa-people-group"
                    color="grey-8" :text-color="curRelatAcnt === item[0] ? 'amber-3' : 'white'" title="view relation"
                    @click.stop="viewAcntRelation(item[0])" />
                </q-item-section>
              </template>
              <q-list>
                <q-item v-for="(role, roleIndex) in item[1].rows" :key="`${item[0]}-newRoles-${roleIndex}`" dense>
                  <q-item-section no-wrap>
                    <q-item-label class="text-h6 text-bold row">
                      <div class="col">{{ `[${role.class}]` }}</div>
                      <div class="col-3">{{ role.name }}</div>
                      <div class="col-2">{{ `lv ${role.lv}` }}</div>
                      <div class="col-6">{{ role.created_at_txt }}</div>
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-expansion-item>
          </template>
        </q-virtual-scroll>
      </div>
      <div class="col full-height column compMinWidth">
        <div class="q-pt-sm q-px-sm">
          <q-tabs v-model="curDetail" class="customTabs text-grey bg-light-blue-2 shadow-2 glossy"
            active-class="text-white bg-blue-6 glossy" indicator-color="transparent" align="justify" dense>
            <q-tab name="acntRelation" label="Relation" />
            <q-tab name="acntInfos" label="Information" />
          </q-tabs>
        </div>

        <q-tab-panels v-model="curDetail" animated class="full-width col bg-transparent" keep-alive>
          <q-tab-panel name="acntRelation" class="fit q-pa-none">
            <AcntRelation v-if="relationExisted" :single-block="true" :query-config="relatQueryConfig"
              :caller="'NewRoleList'" />
            <div v-else class="fit text-h6 text-bold row justify-center items-center">
              Click the button to check the account relations
            </div>
          </q-tab-panel>
          <q-tab-panel name="acntInfos" class="fit q-pa-none">
            <PlayerInfos v-if="detailExisted" :query-config="detailQueryConfig" :single-block="true"
              :caller="'NewRoleList'" />
            <div v-else class="fit text-h6 text-bold row justify-center items-center">
              Click the account to check the details
            </div>
          </q-tab-panel>
        </q-tab-panels>

      </div>
    </div>
  </div>
</template>

<script setup>
import {
  computed, nextTick, ref, watch,
} from 'vue';
import { useQuasar } from 'quasar';
import { useAppConfigsStore } from 'src/stores/AppConfigs';
import { useOperPanelStore } from 'src/stores/OperPanel';
import { useNewRoleListStore } from 'src/stores/NewRoleList';
import { useAcntRelationStore } from 'src/stores/AcntRelation';
import { usePlayerInfosStore } from 'src/stores/PlayerInfos';

import AcntRelation from '../AcntRelation/AcntRelation.vue';
import PlayerInfos from '../PlayerInfos/PlayerInfos.vue';

const $q = useQuasar();
const appConfigs = useAppConfigsStore();
const operPanel = useOperPanelStore();
const newRoleList = useNewRoleListStore();
const acntRelation = useAcntRelationStore();
const playerInfos = usePlayerInfosStore();

const virtualScrollArea = ref(null);
const cacheDataInfos = ref([]);
const cacheDataOpts = computed(() => cacheDataInfos.value.map((info, index) => ({
  label: appConfigs.servers[info.queryConfig.svr],
  value: index,
})));
const curCacheIndex = ref(0);
const curCacheData = computed(() => cacheDataInfos.value[curCacheIndex.value]?.content || {});

const curDetail = ref('acntRelation');

const curRelatAcnt = ref('');
const curDetailAcnt = ref('');
const relatQueryConfig = ref(null);
const detailQueryConfig = ref(null);
const queryAcntRelatList = ref([]);
const queryAcntDetailList = ref([]);
const relationExisted = ref(false);
const detailExisted = ref(false);

async function scrollToCurFocusAcnt() {
  const curList = curDetail.value === 'acntRelation' ? queryAcntRelatList.value : queryAcntDetailList.value;
  const mainIndex = curDetail.value === 'acntRelation' ? acntRelation.mainDataIndex : playerInfos.mainDataIndex;
  const { relateHistIndex, relateObjIndex, focusObj } = curList[mainIndex];

  if (relateHistIndex !== curCacheIndex.value) {
    curCacheIndex.value = relateHistIndex;
    await nextTick();
  }
  if (curDetail.value === 'acntRelation') curRelatAcnt.value = focusObj;
  else curDetailAcnt.value = focusObj;
  virtualScrollArea.value.scrollTo(relateObjIndex, 'center');
}

async function execQueryReq(queryConfig) {
  operPanel.preparing = true;

  const existedDataIndex = cacheDataOpts.value.findIndex(
    (opt) => opt.label === appConfigs.servers[queryConfig.svr],
  );
  const dataInfo = {
    queryConfig: { svr: queryConfig.svr },
    content: await newRoleList.reqNewRoleList(queryConfig),
  };

  if (dataInfo.content === null) $q.notify('There is no new created role');
  else if (dataInfo.content === undefined) $q.notify('Fail to get new created roles');
  else if (existedDataIndex === -1) {
    cacheDataInfos.value.push(dataInfo);
    curCacheIndex.value = cacheDataInfos.value.length - 1;
  } else {
    cacheDataInfos.value[existedDataIndex] = dataInfo;
    curCacheIndex.value = existedDataIndex;
  }
  operPanel.preparing = false;
}

async function viewAcntDetail(event) {
  if (event.target.matches('.acntId')) {
    const curAcnt = event.target.textContent;

    detailQueryConfig.value = {
      name: curAcnt,
      svr: cacheDataInfos.value[curCacheIndex.value].queryConfig.svr,
      time: null,
    };
    queryAcntDetailList.value.push({
      relateHistIndex: curCacheIndex.value,
      relateObjIndex: curCacheData.value.list.findIndex(([acntId]) => acntId === curAcnt),
      focusObj: curAcnt,
    });
    curDetailAcnt.value = curAcnt;
    curDetail.value = 'acntInfos';
    detailExisted.value = true;
    await nextTick();
    operPanel.reqNewData = 'PlayerInfos';
  }
}

async function viewAcntRelation(name) {
  relatQueryConfig.value = {
    name,
    svr: cacheDataInfos.value[curCacheIndex.value].queryConfig.svr,
    // for dev
    time: {
      from: '2023-10-14',
      to: '2023-10-27',
    },
    // for prod
    // time: newRoleList.getRelatQueryTime(),
  };
  queryAcntRelatList.value.push({
    relateHistIndex: curCacheIndex.value,
    relateObjIndex: curCacheData.value.list.findIndex(([acntId]) => acntId === name),
    focusObj: name,
  });
  curRelatAcnt.value = name;
  curDetail.value = 'acntRelation';
  relationExisted.value = true;
  await nextTick();
  operPanel.reqNewData = 'AcntRelation';
}

watch(() => operPanel.reqNewData, async (v) => {
  if (v === 'NewRoleList') {
    await execQueryReq(operPanel.queryConfig);
    operPanel.reqNewData = '';
  }
});
watch(() => acntRelation.mainDataIndex, scrollToCurFocusAcnt);
watch(() => playerInfos.mainDataIndex, scrollToCurFocusAcnt);
watch(() => acntRelation.cacheDeletedAlert, (v) => {
  if (v) {
    queryAcntRelatList.value.shift();
    acntRelation.cacheDeletedAlert = false;
  }
});
watch(() => acntRelation.updateExistedDataAlert, (v) => {
  if (v) queryAcntRelatList.value.pop();
  acntRelation.updateExistedDataAlert = false;
});
watch(() => operPanel.refreshData, async (v) => {
  if (v) {
    const refreshCacheList = cacheDataInfos.value.filter((info) => (
      info.content.some(([acntId]) => operPanel.banAcntIds.includes(acntId))
    ));

    try {
      await Promise.all(refreshCacheList.map((req) => execQueryReq(req.queryConfig)));
      queryAcntRelatList.value.forEach((hist) => {
        hist.relateObjIndex = curCacheData.value.list.findIndex((acnt) => acnt[0] === hist.focusObj);
      });

      $q.notify({
        type: 'positive',
        icon: 'fa-regular fa-circle-check',
        message: 'Success to refresh new created role list',
      });
    } catch (err) {
      console.log('[NewRoleList] refresh err: ', err);
      $q.notify('Fail to refresh new created role list');
    }
  }
});

</script>
