export function scheduleIdleCallback(callback: () => void, timeout = 200): number {
  if (typeof window === 'undefined') {
    return -1;
  }

  if ('requestIdleCallback' in window) {
    return window.requestIdleCallback(callback as IdleRequestCallback, { timeout });
  }

  return setTimeout(callback, timeout) as unknown as number;
}

export function cancelIdleCallbackHandle(handle: number) {
  if (typeof window === 'undefined' || handle === -1) {
    return;
  }

  if ('cancelIdleCallback' in window) {
    window.cancelIdleCallback(handle);
  } else {
    clearTimeout(handle);
  }
}
