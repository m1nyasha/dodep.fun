export function useReplay(ms: number) {
  const on = ref(false);
  let timer: ReturnType<typeof setTimeout> | undefined;

  function play() {
    on.value = false;
    clearTimeout(timer);
    requestAnimationFrame(() => {
      on.value = true;
      timer = setTimeout(() => (on.value = false), ms);
    });
  }

  return { on, play };
}
