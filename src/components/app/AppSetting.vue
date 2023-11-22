<template>
  <q-dialog v-model="appConfigs.showSettingDlg" persistent>
    <q-card style="width: 900px;max-width: 100vw;">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h5 text-bold row justify-start items-center">
          <span class="q-mr-md">APP configs</span>
        </div>
        <q-space />
        <q-icon name="fa-solid fa-xmark" size="md" class="cursor-pointer" v-close-popup @click="rollbackOriginalConfig" />
      </q-card-section>

      <q-separator spaced inset />

      <q-card-section>
        <q-form ref="configForm">
          <q-list bordered>
            <q-expansion-item class="text-h6 text-bold" label="Server setting" group="curAppConfigs">
              <template v-slot:header="props">
                <q-item-section>
                  <div class="row justify-start items-center">
                    <span class="q-mr-sm">Server setting</span>
                    <q-icon v-if="props.expanded" color="green" name="fa-solid fa-plus" class="cursor-pointer"
                      @click.stop="editConfigs('add', 'servers')" />
                  </div>
                </q-item-section>
              </template>
              <div class="scroll" style="max-height: 60vh;">
                <div class="full-width row no-wrap items-center q-col-gutter-x-sm q-px-sm q-mb-sm"
                  v-for="i in curAppConfigs.servers.length" :key="`svrCfg${i}`">
                  <q-field class="col-auto" standout="bg-blue-3" input-class="text-h6" square bg-color="grey-3"
                    bottom-slots>
                    <template v-slot:prepend>
                      <div class="text-h6 text-blue-10 text-bold ellipsis">ID : </div>
                    </template>
                    <template v-slot:control>
                      <div class="text-h6 text-blue-10 text-bold ellipsis">{{ i - 1 }}</div>
                    </template>
                  </q-field>
                  <q-input class="col" standout="bg-blue-3" input-class="text-h6" square bg-color="blue-1"
                    v-model="curAppConfigs.servers[i - 1]" :rules="[
                      val => !!val || 'Please enter server name.',
                      () => curAppConfigs.servers.filter((svr, index) => curAppConfigs.servers.indexOf(svr) !== index).length === 0 || 'This name already existed.'
                    ]">
                    <template v-slot:prepend>
                      <div class="text-h6 text-blue-10 text-bold ellipsis">Name : </div>
                    </template>
                  </q-input>
                  <q-input class="col" standout="bg-blue-3" input-class="text-h6 text-bold"
                    :input-style="`color:${curAppConfigs.serversColor[i - 1]}`" square bg-color="blue-1"
                    v-model="curAppConfigs.serversColor[i - 1]" :rules="[
                      'hexColor',
                      () => curAppConfigs.serversColor.filter((color, index) => curAppConfigs.serversColor.indexOf(color) !== index).length === 0 || 'This color is already in used.'
                    ]">
                    <template v-slot:prepend>
                      <div class="text-h6 text-blue-10 text-bold ellipsis">Color : </div>
                    </template>
                    <template v-slot:append>
                      <q-icon name="fa-solid fa-eye-dropper" class="cursor-pointer">
                        <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                          <q-color v-model="curAppConfigs.serversColor[i - 1]" no-header-tabs />
                        </q-popup-proxy>
                      </q-icon>
                    </template>
                  </q-input>
                  <q-field class="col-auto text-h6" borderless bottom-slots>
                    <template v-slot:control>
                      <q-icon v-if="i > appConfigs.servers.length" color="grey" name="fa-solid fa-trash-can"
                        class="cursor-pointer" @click="editConfigs('delete', 'servers', i - 1)" />
                      <q-icon v-else color="transparent" name="fa-solid fa-trash-can" />
                    </template>
                  </q-field>
                </div>
              </div>
            </q-expansion-item>

            <q-separator />

            <q-expansion-item class="text-h6 text-bold" label="Race setting" group="curAppConfigs">
              <div class="full-width row no-wrap items-center q-col-gutter-x-sm q-px-sm  q-mb-sm"
                v-for="i in curAppConfigs.races.length" :key="`svrCfg${i}`">
                <q-input class="col" standout="bg-blue-3" input-class="text-h6 text-bold"
                  :input-style="`color:${curAppConfigs.racesColor[i - 1]}`" square bg-color="blue-1"
                  v-model="curAppConfigs.racesColor[i - 1]" :rules="[
                    'hexColor',
                    () => curAppConfigs.racesColor.filter((color, index) => curAppConfigs.racesColor.indexOf(color) !== index).length === 0 || 'This color is already in used.'
                  ]">
                  <template v-slot:prepend>
                    <div class="text-h6 text-blue-10 text-bold ellipsis">{{ `Race ${curAppConfigs.races[i - 1]} color : `
                    }}
                    </div>
                  </template>
                  <template v-slot:append>
                    <q-icon name="fa-solid fa-eye-dropper" class="cursor-pointer">
                      <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                        <q-color v-model="curAppConfigs.racesColor[i - 1]" no-header-tabs />
                      </q-popup-proxy>
                    </q-icon>
                  </template>
                </q-input>
              </div>
            </q-expansion-item>

            <q-separator />

            <q-expansion-item class="text-h6 text-bold" header-class="text-red" label="API setting ⚠"
              group="curAppConfigs">
              <div class="q-pa-sm">
                <q-input class="q-mb-sm" standout="bg-blue-3" input-class="text-h6 text-bold" square bg-color="blue-1"
                  v-model="curAppConfigs.gameApiUrl"
                  :rules="[val => !!val || 'Please enter game api url', val => examURL(val) || 'Invalid url']">
                  <template v-slot:prepend>
                    <div class="text-h6 text-blue-10 text-bold ellipsis" style="width: 180px;">Game api url : </div>
                  </template>
                </q-input>
                <q-input class="q-mb-sm" standout="bg-blue-3" input-class="text-h6 text-bold" square bg-color="blue-1"
                  v-model="curAppConfigs.acntApiUrl"
                  :rules="[val => !!val || 'Please enter account api url', val => examURL(val) || 'Invalid url']">
                  <template v-slot:prepend>
                    <div class="text-h6 text-blue-10 text-bold ellipsis" style="width: 180px;">Account api url : </div>
                  </template>
                </q-input>
              </div>
            </q-expansion-item>
          </q-list>

          <div class="q-mt-md row justify-between items-center">
            <q-btn-group glossy push>
              <q-btn label="Import" color="green" @click="uploadEle.pickFiles()">
                <q-file ref="uploadEle" borderless class="hidden" v-model="configFile" accept=".json"
                  @rejected="onRejected" />
              </q-btn>
              <q-btn label="Export" color="indigo" @click="exportJSON('appSetting', curAppConfigs)" />
            </q-btn-group>
            <q-btn-group glossy push>
              <q-btn label="Reset" color="grey" v-close-popup @click="resetConfig" />
              <q-btn label="Apply" color="primary" @click="updateConfig" />
            </q-btn-group>
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useAppConfigsStore } from 'src/stores/AppConfigs';
import { exportJSON } from 'src/utils/common';

const $q = useQuasar();
const appConfigs = useAppConfigsStore();

const curAppConfigs = ref({
  servers: [...appConfigs.servers],
  serversColor: [...appConfigs.serversColor],
  races: [...appConfigs.races],
  racesColor: Object.values(appConfigs.racesColor),
  gameApiUrl: appConfigs.gameApiUrl,
  acntApiUrl: appConfigs.acntApiUrl,
});
const configForm = ref(null);
const uploadEle = ref(null);
const configFile = ref(null);

function onRejected() {
  $q.notify({ message: 'Only accept JSON file' });
}

const pattern = new RegExp(
  '^(https?:\\/\\/)?'
  + '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'
  + '((\\d{1,3}\\.){3}\\d{1,3}))'
  + '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'
  + '(\\?[;&a-z\\d%_.~+=-]*)?'
  + '(\\#[-a-z\\d_]*)?$',
  'i',
);
const examURL = (url) => appConfigs.appMode === 'dev' || pattern.test(url);

function rollbackOriginalConfig() {
  curAppConfigs.value = {
    servers: appConfigs.servers.slice(),
    serversColor: appConfigs.serversColor.slice(),
    races: appConfigs.races.slice(),
    racesColor: Object.values(appConfigs.racesColor),
    gameApiUrl: appConfigs.gameApiUrl,
    acntApiUrl: appConfigs.acntApiUrl,
  };
}

function editConfigs(action, obj, index) {
  if (action === 'add') {
    curAppConfigs.value[obj].push('');
    curAppConfigs.value[`${obj}Color`].push('');
  } else {
    curAppConfigs.value[obj].splice(index, 1);
    curAppConfigs.value[`${obj}Color`].splice(index, 1);
  }
}

function syncModifiedConfigs(cfg) {
  appConfigs.servers = cfg.servers.slice();
  appConfigs.serversColor = cfg.serversColor.slice();
  appConfigs.races = cfg.races.slice();
  appConfigs.racesColor = cfg.racesColor.reduce((result, color, index) => {
    result[cfg.races[index]] = color;
    return result;
  }, {});
  appConfigs.gameApiUrl = cfg.gameApiUrl;
  appConfigs.acntApiUrl = cfg.acntApiUrl;
}

function resetConfig() {
  window.localStorage.removeItem('curAppConfigs');
  syncModifiedConfigs(appConfigs.defaultConfigs);
  appConfigs.appCfgChange = true;
  $q.notify({
    type: 'positive',
    icon: 'fa-regular fa-circle-check',
    message: 'Success to reset the configs',
  });
}

function updateConfig() {
  configForm.value.validate().then((isSuccessed) => {
    if (isSuccessed) {
      window.localStorage.setItem('curAppConfigs', JSON.stringify(curAppConfigs.value));
      syncModifiedConfigs(curAppConfigs.value);
      $q.notify({
        type: 'positive',
        icon: 'fa-regular fa-circle-check',
        message: 'Success to update the configs',
      });
      appConfigs.showSettingDlg = false;
    } else $q.notify({ message: 'Invalid app configs' });
  });
}

function importConfig(content) {
  try {
    const importCfg = JSON.parse(content);
    const newCfg = {};

    ['servers', 'races'].forEach((obj) => {
      if (importCfg[obj] && importCfg[obj] instanceof Array
        && importCfg[`${obj}Color`] && importCfg[`${obj}Color`] instanceof Array) {
        if (importCfg[obj].length === importCfg[`${obj}Color`].length) {
          newCfg[obj] = importCfg[obj];
          newCfg[`${obj}Color`] = importCfg[`${obj}Color`];
        }
      }
    });

    if (importCfg.gameApiUrl && typeof importCfg.gameApiUrl === 'string') {
      newCfg.gameApiUrl = importCfg.gameApiUrl;
    }

    if (importCfg.acntApiUrl && typeof importCfg.acntApiUrl === 'string') {
      newCfg.acntApiUrl = importCfg.acntApiUrl;
    }

    curAppConfigs.value = {
      ...curAppConfigs.value,
      ...newCfg,
    };

    return true;
  } catch (err) {
    console.log('[examImport] Error: ', err);
    return false;
  }
}

watch(configFile, (file) => {
  if (file !== null) {
    const fileReader = new FileReader();
    fileReader.onload = () => {
      if (importConfig(fileReader.result)) {
        $q.notify({
          type: 'positive',
          icon: 'fa-regular fa-circle-check',
          message: 'Success to load the configs',
        });
      } else {
        $q.notify({ message: 'Fail to parse the config' });
      }
      configFile.value = null;
    };

    fileReader.readAsText(file);
  }
});

watch(() => appConfigs.appCfgChange, (v) => {
  if (v) {
    curAppConfigs.value = {
      servers: appConfigs.servers.slice(),
      serversColor: appConfigs.serversColor.slice(),
      races: appConfigs.races.slice(),
      racesColor: Object.values(appConfigs.racesColor),
      gameApiUrl: appConfigs.gameApiUrl,
      acntApiUrl: appConfigs.acntApiUrl,
    };
    appConfigs.appCfgChange = false;
  }
});

</script>
