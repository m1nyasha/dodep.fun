export default defineNuxtPlugin(async () => {
  try {
    await useMe().refresh();
  } catch (e) {
    console.error('Не удалось загрузить игрока на SSR', e);
  }
});
