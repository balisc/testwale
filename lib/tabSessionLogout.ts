const SKIP_LOGOUT_KEY = 'qw_skip_tab_logout';
const INTERNAL_NAV_KEY = 'qw_internal_nav';

function shouldSkipTabLogout() {
  if (typeof window === 'undefined') return true;

  if (sessionStorage.getItem(SKIP_LOGOUT_KEY) === '1') {
    sessionStorage.removeItem(SKIP_LOGOUT_KEY);
    return true;
  }

  if (sessionStorage.getItem(INTERNAL_NAV_KEY) === '1') {
    sessionStorage.removeItem(INTERNAL_NAV_KEY);
    return true;
  }

  return false;
}

function clearSessionAuthMarkers() {
  sessionStorage.removeItem('qw_practice_skip_login');
}

function sendTabLogoutRequest() {
  const payload = new Blob([], { type: 'application/json' });

  if (typeof navigator.sendBeacon === 'function') {
    navigator.sendBeacon('/api/auth/logout', payload);
    return;
  }

  void fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'include',
    keepalive: true,
  });
}

/**
 * Logs the user out when the browser tab is closed.
 * Skips refresh shortcuts and same-origin hard navigations.
 */
export function registerTabCloseLogout(onLogout: () => void) {
  if (typeof window === 'undefined') return () => {};

  const markReloadSkip = (event: KeyboardEvent) => {
    const key = event.key.toLowerCase();
    if (key === 'f5' || ((event.ctrlKey || event.metaKey) && key === 'r')) {
      sessionStorage.setItem(SKIP_LOGOUT_KEY, '1');
    }
  };

  const markInternalNavigation = (event: MouseEvent) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const anchor = target.closest('a[href]');
    if (!anchor || !(anchor instanceof HTMLAnchorElement)) return;
    if (anchor.target === '_blank' || anchor.hasAttribute('download')) return;

    try {
      const url = new URL(anchor.href, window.location.href);
      if (url.origin === window.location.origin) {
        sessionStorage.setItem(INTERNAL_NAV_KEY, '1');
      }
    } catch {
      /* ignore malformed href */
    }
  };

  const handlePageHide = (event: PageTransitionEvent) => {
    if (event.persisted || shouldSkipTabLogout()) return;

    sendTabLogoutRequest();
    clearSessionAuthMarkers();
    onLogout();
  };

  window.addEventListener('keydown', markReloadSkip);
  document.addEventListener('click', markInternalNavigation, true);
  window.addEventListener('pagehide', handlePageHide);

  return () => {
    window.removeEventListener('keydown', markReloadSkip);
    document.removeEventListener('click', markInternalNavigation, true);
    window.removeEventListener('pagehide', handlePageHide);
  };
}
