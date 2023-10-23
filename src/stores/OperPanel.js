import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { useAppConfigsStore } from './AppConfigs';

export const useOperPanelStore = defineStore('OperPanel', () => {
  const appConfigs = useAppConfigsStore();

  const curFunc = ref(appConfigs.appFuncs[0].value);
  const autoSwitchFunc = ref(false);
  const queryConfig = ref({
    svr: 0,
    name: null,
    time: null,
  });
  const reqNewData = ref('');
  const preparing = ref(false);
  const activateDatepicker = computed(() => (
    curFunc.value === 'SvrStat'
    || curFunc.value === 'AcntRelation'
    || curFunc.value === 'ChipWar'
    || curFunc.value === 'ItemPurchase'
    || curFunc.value === 'PvpHistory'
  ));
  const datepickerVal = computed(() => (
    queryConfig.value.time
      ? curFunc.value !== 'ChipWar' && curFunc.value !== 'PvpHistory'
        ? `${queryConfig.value.time.from || queryConfig.value.time} ~ ${queryConfig.value.time.to || queryConfig.value.time}`
        : queryConfig.value.time
      : ''
  ));
  const activateSvrSelector = computed(() => (
    curFunc.value !== 'SvrDashBoard' && curFunc.value !== 'BanList'
  ));
  const activateInputField = computed(() => (
    curFunc.value === 'PlayerInfos'
    || curFunc.value === 'AcntRelation'
    || curFunc.value === 'ItemPurchase'
    || curFunc.value === 'PvpHistory'
    || curFunc.value === 'NameHistory'
  ));
  const activatePeriodPicker = computed(() => curFunc.value === 'ItemSellRanking');

  const deactivateReqSending = computed(() => {
    if (!appConfigs.servers.length || !appConfigs.races.length) return true;
    switch (curFunc.value) {
      case 'SvrStat':
      case 'ChipWar':
        return !queryConfig.value.time || reqNewData.value !== '';
      case 'PlayerInfos':
      case 'PvpHistory':
      case 'NameHistory':
        return !queryConfig.value.name || reqNewData.value !== '';
      case 'AcntRelation':
      case 'ItemPurchase':
        return !queryConfig.value.time || !queryConfig.value.name || reqNewData.value !== '';
      case 'ItemSellRanking':
        return (
          !queryConfig.value.time.days && !queryConfig.value.time.hours && !queryConfig.value.time.mins
        ) || reqNewData.value !== '';
      default:
        return false;
    }
  });

  const tableConfig = ref(null);
  const tableDlgShow = ref(false);

  const banBatches = ref([]);
  const banAcntIds = computed(() => banBatches.value.map((banInfo) => banInfo.GID));
  const banDlgShow = ref(false);
  const banIsProcessing = ref(null);

  const refreshData = ref(false);
  const delegateQuery = ref(null);

  return {
    curFunc,
    autoSwitchFunc,
    queryConfig,
    reqNewData,
    preparing,
    activateDatepicker,
    activateSvrSelector,
    activateInputField,
    activatePeriodPicker,
    datepickerVal,
    deactivateReqSending,
    tableConfig,
    tableDlgShow,
    banAcntIds,
    banBatches,
    banDlgShow,
    banIsProcessing,
    refreshData,
    delegateQuery,
  };
});
