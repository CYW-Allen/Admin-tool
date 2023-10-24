import { boot } from 'quasar/wrappers';
import ApexCharts from 'vue3-apexcharts';

// "async" is optional;
// more info on params: https://v2.quasar.dev/quasar-cli/boot-files
export default boot(({ app }) => {
  app.use(ApexCharts);
});
