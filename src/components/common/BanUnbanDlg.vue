<template>
  <q-dialog v-model="operPanel.banDlgShow" persistent @hide="clearBanBatches">
    <q-card class="operDialog">
      <q-card-section>
        <div :class="`text-h5 text-bold ${operPanel.banBatches[0].action === 'ban' ? 'text-negative' : 'text-positive'}`">
          {{ `${operPanel.banBatches[0].action === 'ban' ? 'Lock account' : 'Unlock account'}` }}
        </div>
      </q-card-section>
      <q-separator />
      <q-card-section>
        <div class="text-h6 text-bold">
          <div>Account list:</div>
          <div :class="`banUnbanList ${operPanel.banBatches[0].action === 'ban' ? 'text-red' : 'text-green'
            }`">
            <div v-for="(info, i) in operPanel.banBatches" :key="i">
              {{ `${info.UID},${info.GID},${info.name}` }}
            </div>
          </div>
        </div>
        <q-input filled v-model="reason" autofocus :rules="[checkReason]"
          :bg-color="`${operPanel.banBatches[0].action === 'ban' ? 'red-1' : 'green-1'}`" class="q-mt-md text-h6">
          <template v-slot:prepend>
            <div :class="`text-h6 ${operPanel.banBatches[0].action === 'ban' ? 'text-red-8' : 'text-green-8'
              }`">Reason: </div>
          </template>
        </q-input>
      </q-card-section>
      <q-card-actions align="right" class="q-mr-sm q-mb-sm">
        <q-btn glossy color="grey-8" label="cancel" v-close-popup @click="cancelBanUnbanReq" />
        <q-btn glossy color="blue-8" label="confirm" :disable="reason.length === 0 || reason.length > 16" v-close-popup
          @click="banUnbanAccount" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { useOperPanelStore } from 'src/stores/OperPanel';
import { ref } from 'vue';
import { useQuasar } from 'quasar';

const operPanel = useOperPanelStore();
const $q = useQuasar();
const reason = ref('');
const checkReason = (val) => (val.length > 0 && val.length <= 16) || "The reason's char length should be between 1 to 16";

function clearBanBatches() {
  if (operPanel.banIsProcessing === null && !operPanel.refreshData) operPanel.banBatches = [];
}

function cancelBanUnbanReq() {
  operPanel.banIsProcessing = null;
}

function simulateBanUnBan(action, serialNum, uid, reasonStr) {
  return new Promise((resolve) => {
    console.log(`Processing: [${serialNum}] ${action} ${uid} ${reasonStr}`);
    setTimeout(() => resolve(true), 3000);
  });
}

async function banUnbanAccount() {
  try {
    const allSuccess = (await Promise.all(operPanel.banBatches.map((info) => (
      simulateBanUnBan(info.action, info.acntSN, info.UID, reason.value)
    )))).every((result) => Boolean(result));

    if (allSuccess) {
      $q.notify({
        type: 'positive',
        icon: 'fa-regular fa-circle-check',
        message: 'All requests are complete',
      });
    } else $q.notify({ message: 'Fail to process some accounts' });
  } catch (err) {
    console.log(`[banUnbanAccount] Error: ${err.message}`);
    $q.notify({ message: 'Fail to process the requests' });
  }
  operPanel.banIsProcessing = null;
  operPanel.refreshData = true;
}
</script>
