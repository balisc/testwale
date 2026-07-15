'use client';

import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { getSignupErrorMessage } from '@/lib/signupValidation';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback?: (response: { credential?: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
            itp_support?: boolean;
            use_fedcm_for_prompt?: boolean;
            ux_mode?: 'popup' | 'redirect';
            login_uri?: string;
          }) => void;
          renderButton: (
            element: HTMLElement,
            options: {
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
              shape?: 'rectangular' | 'pill' | 'circle' | 'square';
              width?: number;
              logo_alignment?: 'left' | 'center';
              type?: 'standard' | 'icon';
            },
          ) => void;
        };
      };
    };
  }
}

type GoogleSignInButtonProps = {
  onCredential?: (credential: string) => void;
  onError?: (message: string) => void;
  disabled?: boolean;
  align?: 'left' | 'center';
  clientId?: string;
  overlay?: boolean;
  redirectLoginUri?: string;
};

const SCRIPT_ID = 'google-identity-services';
const MAX_BUTTON_WIDTH = 600;
const POPUP_GUARD_MS = 8000;

let gsiInitializedKey: string | null = null;
const gsiCredentialHandlers = new Set<(credential: string) => void>();
const gsiCancelHandlers = new Set<() => void>();
const gsiPopupBlockedHandlers = new Set<() => void>();

function ensureGoogleIdentityInitialized(clientId: string, redirectLoginUri?: string) {
  if (!window.google?.accounts?.id) return false;

  const initKey = redirectLoginUri ? `${clientId}:redirect:${redirectLoginUri}` : `${clientId}:popup`;
  if (gsiInitializedKey === initKey) return true;

  if (redirectLoginUri) {
    window.google.accounts.id.initialize({
      client_id: clientId,
      ux_mode: 'redirect',
      login_uri: redirectLoginUri,
      auto_select: false,
      itp_support: true,
    });
  } else {
    window.google.accounts.id.initialize({
      client_id: clientId,
      ux_mode: 'popup',
      callback: (response) => {
        if (response.credential) {
          gsiCredentialHandlers.forEach((handler) => handler(response.credential!));
          return;
        }
        gsiCancelHandlers.forEach((handler) => handler());
      },
      auto_select: false,
      cancel_on_tap_outside: true,
      itp_support: true,
    });
  }

  gsiInitializedKey = initKey;
  return true;
}

/**
 * Detects when Google's GIS client fails to open a popup (browser blocker).
 * Returns a cleanup function that restores window.open.
 */
function armPopupOpenGuard(onBlocked: () => void): () => void {
  const originalOpen = window.open.bind(window);
  let finished = false;
  let blockedNotified = false;
  let sawOpenWindow = false;

  const notifyBlocked = () => {
    if (blockedNotified || sawOpenWindow) return;
    blockedNotified = true;
    onBlocked();
  };

  window.open = ((url?: string | URL, target?: string, features?: string) => {
    let popup: Window | null = null;
    try {
      popup = originalOpen(url, target, features);
    } catch {
      notifyBlocked();
      return null;
    }

    if (!popup) {
      notifyBlocked();
      return null;
    }

    sawOpenWindow = true;
    return popup;
  }) as typeof window.open;

  return () => {
    if (finished) return;
    finished = true;
    window.open = originalOpen;
  };
}

type ButtonRenderConfig = {
  type: 'standard' | 'icon';
  size: 'large' | 'medium' | 'small';
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  width: number;
};

function readBuiltInClientId() {
  return (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '').trim();
}

function getButtonRenderConfig(container: HTMLElement, overlay = false): ButtonRenderConfig {
  const width = Math.floor(container.getBoundingClientRect().width);
  const safeWidth =
    width > 0 ? Math.min(Math.max(width, 40), MAX_BUTTON_WIDTH) : overlay ? 280 : 168;

  if (overlay) {
    if (safeWidth < 100) {
      return { type: 'icon', size: 'medium', width: Math.max(40, safeWidth) };
    }

    return {
      type: 'standard',
      size: safeWidth >= 280 ? 'large' : safeWidth >= 200 ? 'medium' : 'small',
      text: 'continue_with',
      width: safeWidth,
    };
  }

  if (width <= 0) {
    return { type: 'standard', size: 'medium', text: 'signin', width: 168 };
  }

  if (width < 180) {
    return { type: 'icon', size: 'medium', width: Math.max(40, width) };
  }

  if (width < 260) {
    return {
      type: 'standard',
      size: 'medium',
      text: 'signin',
      width: Math.min(width, MAX_BUTTON_WIDTH),
    };
  }

  return {
    type: 'standard',
    size: 'large',
    text: 'continue_with',
    width: Math.min(width, MAX_BUTTON_WIDTH),
  };
}

function configKey(config: ButtonRenderConfig) {
  return `${config.type}-${config.size}-${config.text ?? 'icon'}-${config.width}`;
}

export default function GoogleSignInButton({
  onCredential,
  onError,
  disabled = false,
  align = 'center',
  clientId: clientIdProp,
  overlay = false,
  redirectLoginUri,
}: GoogleSignInButtonProps) {
  const { language } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const lastRenderKeyRef = useRef('');
  const onCredentialRef = useRef(onCredential);
  const onErrorRef = useRef(onError);
  const popupGuardCleanupRef = useRef<(() => void) | null>(null);
  const popupBlockedRef = useRef(false);
  const [resolvedClientId, setResolvedClientId] = useState(() => {
    const fromProp = (clientIdProp ?? '').trim();
    if (fromProp) return fromProp;
    return readBuiltInClientId();
  });
  const [configState, setConfigState] = useState<'loading' | 'ready' | 'missing'>(() =>
    resolvedClientId ? 'ready' : 'loading',
  );

  useEffect(() => {
    onCredentialRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    if (redirectLoginUri) return;

    const handleCredential = (credential: string) => {
      popupBlockedRef.current = false;
      popupGuardCleanupRef.current?.();
      popupGuardCleanupRef.current = null;
      onCredentialRef.current?.(credential);
    };

    const handleCancel = () => {
      if (popupBlockedRef.current) return;
      onErrorRef.current?.(getSignupErrorMessage(language, 'googlePopupCancelled'));
    };

    const handlePopupBlocked = () => {
      popupBlockedRef.current = true;
      onErrorRef.current?.(getSignupErrorMessage(language, 'googlePopupBlocked'));
    };

    gsiCredentialHandlers.add(handleCredential);
    gsiCancelHandlers.add(handleCancel);
    gsiPopupBlockedHandlers.add(handlePopupBlocked);

    return () => {
      gsiCredentialHandlers.delete(handleCredential);
      gsiCancelHandlers.delete(handleCancel);
      gsiPopupBlockedHandlers.delete(handlePopupBlocked);
      popupGuardCleanupRef.current?.();
      popupGuardCleanupRef.current = null;
    };
  }, [redirectLoginUri, language]);

  useEffect(() => {
    const fromProp = (clientIdProp ?? '').trim();
    if (fromProp) {
      setResolvedClientId(fromProp);
      setConfigState('ready');
      return;
    }

    const builtIn = readBuiltInClientId();
    if (builtIn) {
      setResolvedClientId(builtIn);
      setConfigState('ready');
      return;
    }

    let cancelled = false;

    const loadClientId = async () => {
      try {
        const response = await fetch('/api/auth/public-config', { cache: 'no-store' });
        const data = (await response.json()) as { googleClientId?: string | null };
        if (cancelled) return;

        const id = (data.googleClientId ?? '').trim();
        if (id) {
          setResolvedClientId(id);
          setConfigState('ready');
          return;
        }
      } catch {
        // fall through to missing state
      }

      if (!cancelled) {
        setConfigState('missing');
      }
    };

    void loadClientId();

    return () => {
      cancelled = true;
    };
  }, [clientIdProp]);

  useEffect(() => {
    if (!resolvedClientId || disabled || configState !== 'ready') return;

    const container = containerRef.current;
    if (!container) return;

    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let handleWindowResize: (() => void) | null = null;
    let guardTimeout: ReturnType<typeof setTimeout> | null = null;

    const clearPopupGuard = () => {
      if (guardTimeout) {
        clearTimeout(guardTimeout);
        guardTimeout = null;
      }
      popupGuardCleanupRef.current?.();
      popupGuardCleanupRef.current = null;
    };

    const armGuardForClick = () => {
      if (redirectLoginUri) return;
      clearPopupGuard();
      popupBlockedRef.current = false;

      popupGuardCleanupRef.current = armPopupOpenGuard(() => {
        gsiPopupBlockedHandlers.forEach((handler) => handler());
        clearPopupGuard();
      });

      guardTimeout = setTimeout(() => {
        clearPopupGuard();
      }, POPUP_GUARD_MS);
    };

    const renderGoogleButton = () => {
      if (!window.google?.accounts?.id || !buttonRef.current || !containerRef.current) return;

      const containerWidth = Math.floor(containerRef.current.getBoundingClientRect().width);
      if (containerWidth <= 0) return;

      const config = getButtonRenderConfig(containerRef.current, overlay);
      const renderKey = configKey(config);

      if (renderKey === lastRenderKeyRef.current && buttonRef.current.childElementCount > 0) {
        return;
      }

      lastRenderKeyRef.current = renderKey;
      buttonRef.current.innerHTML = '';

      if (config.type === 'icon') {
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: 'outline',
          size: config.size,
          shape: 'circle',
          type: 'icon',
          width: config.width,
        });
        return;
      }

      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'outline',
        size: config.size,
        text: config.text,
        shape: 'rectangular',
        type: 'standard',
        width: config.width,
        logo_alignment: 'left',
      });
    };

    const initGoogle = () => {
      if (!buttonRef.current || !containerRef.current) return;
      if (!ensureGoogleIdentityInitialized(resolvedClientId, redirectLoginUri)) return;

      renderGoogleButton();
      requestAnimationFrame(() => renderGoogleButton());

      if (typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(() => {
          if (resizeTimer) clearTimeout(resizeTimer);
          resizeTimer = setTimeout(renderGoogleButton, 50);
        });
        resizeObserver.observe(container);
      } else {
        handleWindowResize = () => {
          if (resizeTimer) clearTimeout(resizeTimer);
          resizeTimer = setTimeout(renderGoogleButton, 100);
        };
        window.addEventListener('resize', handleWindowResize);
      }
    };

    lastRenderKeyRef.current = '';
    container.addEventListener('pointerdown', armGuardForClick, true);

    const existingScript = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existingScript) {
      if (window.google?.accounts?.id) {
        initGoogle();
      } else {
        existingScript.addEventListener('load', initGoogle);
      }
    } else {
      const script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initGoogle;
      script.onerror = () =>
        onErrorRef.current?.('Could not load Google sign-in. Check your internet connection.');
      document.body.appendChild(script);
    }

    return () => {
      clearPopupGuard();
      container.removeEventListener('pointerdown', armGuardForClick, true);
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeObserver?.disconnect();
      if (handleWindowResize) {
        window.removeEventListener('resize', handleWindowResize);
      }
      existingScript?.removeEventListener('load', initGoogle);
      lastRenderKeyRef.current = '';
    };
  }, [resolvedClientId, disabled, configState, overlay, redirectLoginUri]);

  if (configState === 'loading') {
    if (overlay) {
      return <div className="h-full w-full" aria-hidden="true" />;
    }
    return (
      <div className="flex min-h-[44px] w-full items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <span className="text-[13px] font-medium text-slate-500">Loading Google sign-in...</span>
      </div>
    );
  }

  if (configState === 'missing' || !resolvedClientId) {
    if (overlay) {
      return null;
    }
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-[11px] leading-6 text-amber-800 min-[360px]:px-4 min-[360px]:text-[13px]">
        Google sign-in is not configured. Add{' '}
        <code className="font-semibold">NEXT_PUBLIC_GOOGLE_CLIENT_ID</code>,{' '}
        <code className="font-semibold">GOOGLE_CLIENT_ID</code>, or{' '}
        <code className="font-semibold">GOOGLE_CLIENT_ID_AUTH</code> in Vercel Environment Variables, then
        redeploy.
      </div>
    );
  }

  if (overlay) {
    return (
      <div
        ref={containerRef}
        className={`h-full w-full ${disabled ? 'pointer-events-none' : ''}`}
      >
        <div
          ref={buttonRef}
          className="flex h-full w-full min-w-0 items-stretch overflow-hidden leading-[0] [&>div]:!h-full [&>div]:!min-h-[40px] [&>div]:!w-full [&>div]:!max-w-full [&_iframe]:!block [&_iframe]:!h-full [&_iframe]:!min-h-[40px] [&_iframe]:!w-full [&_iframe]:!max-w-full"
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`w-full min-w-0 ${disabled ? 'pointer-events-none opacity-60' : ''}`}
    >
      <div
        ref={buttonRef}
        className={`flex h-[44px] w-full min-w-0 max-w-full overflow-hidden leading-[0] ${align === 'left' ? 'justify-start' : 'justify-center'} [&>div]:!h-[44px] [&>div]:!max-w-full [&>div]:!leading-[0] [&_iframe]:!block [&_iframe]:!h-[44px] [&_iframe]:!max-w-full`}
      />
    </div>
  );
}
