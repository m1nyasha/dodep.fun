<script setup lang="ts">
import { ICONS, type IconName } from '../icons';

defineProps<{ name: IconName }>();
</script>

<template>
  <!-- eslint-disable-next-line vue/no-v-html -->
  <svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true" v-html="ICONS[name]" />
</template>

<style scoped>
.ui-icon {
  width: 20px;
  height: 20px;
  fill: none;
  stroke: currentcolor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
  flex: none;
}
</style>
