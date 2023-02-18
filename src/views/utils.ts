export function debounce(fn: () => any, timeout: number) {
  let timer: NodeJS.Timeout | undefined;
  return () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn();
    }, timeout);
  };
}
