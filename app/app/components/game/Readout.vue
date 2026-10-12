<script setup lang="ts">
defineProps<{ opened: string; multiplier: string; chance: string }>();
</script>

<template>
  <div class="readout">
    <div>
      <span>Открыто</span><b class="mono">{{ opened }}</b>
    </div>
    <div>
      <span>Множитель</span><b class="mono">{{ multiplier }}</b>
    </div>
    <div>
      <span>Шанс следующей</span><b class="mono">{{ chance }}</b>
    </div>
  </div>
</template>

<style scoped>
.readout {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  max-width: var(--w);
  margin: 16px auto 0;
}

.readout div {
  padding: 9px 12px;
  border-radius: 13px;
  background: var(--c-2);
}

span {
  display: block;
  font-size: 11.5px;
  color: var(--c-muted);
}

b {
  display: block;
  margin-top: 1px;
  font-size: 18px;
  font-weight: 600;
}

@media (width <= 760px) {
  .readout {
    gap: 6px;
  }

  .readout div {
    padding: 8px 10px;
  }

  span {
    font-size: 10.5px;
  }

  b {
    font-size: 15px;
  }
}
</style>
