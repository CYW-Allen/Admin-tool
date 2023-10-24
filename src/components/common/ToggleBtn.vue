<template>
  <div class="checkBtn q-mr-sm">
    <input type="checkbox" class="checkbox" v-model="toggleStatus" />
    <div class="knob" :id="props.eleId" data-before="" data-after="">
      <span></span>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue';

const props = defineProps({
  eleId: {
    type: String,
    required: true,
  },
  vals: {
    type: Object,
    required: true,
  },
  curVal: {
    type: String,
    required: true,
  },
});
const emit = defineEmits(['statusChange']);
const toggleStatus = ref(true);

watch(toggleStatus, (val) => {
  if (val) emit('statusChange', props.vals.left);
  else emit('statusChange', props.vals.right);
});

onMounted(() => {
  const toggleEle = document.getElementById(props.eleId);

  toggleEle.dataset.before = props.vals.left;
  toggleEle.dataset.after = props.vals.right;
  toggleStatus.value = props.curVal === props.vals.left;
});
</script>

<style>
.checkBtn {
  width: 8rem;
  overflow: hidden;
  position: relative;
  border: 1px solid lightgray;
  border-radius: 5%;
}

.checkbox {
  position: relative;
  width: 100%;
  height: 100%;
  padding: 0;
  margin: 0;
  z-index: 10;
  opacity: 0;
  cursor: pointer;
}

.knob {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.checkBtn .knob::before,
.checkBtn .knob::after,
.checkBtn .knob span {
  width: 4rem;
  font-size: 1rem;
  text-align: center;
  position: absolute;
  top: 0;
  bottom: 0;
  transition: 0.2s ease all;
  display: flex;
  justify-content: center;
  align-items: center;
}

.checkBtn .knob::before,
.checkBtn .knob::after {
  background-color: rgb(191, 235, 250);
}

.checkBtn .knob::before {
  left: 0;
  content: attr(data-before);
}

.checkBtn .knob::after {
  right: 0;
  content: attr(data-after);
}

.checkBtn .knob span {
  left: 0;
  background-image: linear-gradient(#0dccea, #0d70ea);
  border-top-left-radius: 5%;
  border-bottom-left-radius: 5%;
  z-index: 3;
}

.checkBtn .checkbox:checked+.knob span {
  left: 4rem;
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  border-top-right-radius: 5%;
  border-bottom-right-radius: 5%;
}
</style>
