import { onUnmounted } from 'vue';

export function useTimerCleanup() {
  const timers = new Set();

  const safeTimeout = (fn, delay) => {
    const id = setTimeout(() => {
      timers.delete(id);
      fn();
    }, delay);
    timers.add(id);
    return id;
  };

  const clearAllTimers = () => {
    timers.forEach(id => clearTimeout(id));
    timers.clear();
  };

  onUnmounted(clearAllTimers);

  return { safeTimeout, clearAllTimers };
}
