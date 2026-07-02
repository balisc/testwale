'use client';

import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
            itp_support?: boolean;
            use_fedcm_for_prompt?: boolean;
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
  onCredential: (credential: string) => void;
  onError?: (message: string) => void;
  disabled?: boolean;
  align?: 'left' | 'center';
};

const SCRIPT_ID = 'google-identity-services';
const MAX_BUTTON_WIDTH = 600;

type ButtonRenderConfig = {
  type: 'standard' | 'icon';
  size: 'large' | 'medium' | 'small';
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  width: number;
};

function getButtonRenderConfig(container: HTMLElement): ButtonRenderConfig {
  const width = Math.floor(container.getBoundingClientRect().width);

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
}: GoogleSignInButtonProps) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const googleInitializedRef = useRef(false);
  const lastRenderKeyRef = useRef('');
  const onCredentialRef = useRef(onCredential);
  const onErrorRef = useRef(onError);
  const clientId = (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '').trim();

  useEffect(() => {
    onCredentialRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    if (!clientId || disabled) return;

    const container = buttonRef.current;
    if (!container) return;

    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let handleWindowResize: (() => void) | null = null;

    const renderGoogleButton = () => {
      if (!window.google?.accounts?.id || !buttonRef.current) return;

      const config = getButtonRenderConfig(buttonRef.current);
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
      if (!window.google?.accounts?.id || !buttonRef.current) return;

      if (!googleInitializedRef.current) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            if (response.credential) {
              onCredentialRef.current(response.credential);
              return;
            }
            onErrorRef.current?.('Google sign-in was cancelled.');
          },
          auto_select: false,
          cancel_on_tap_outside: true,
          itp_support: true,
        });
        googleInitializedRef.current = true;
      }

      renderGoogleButton();

      if (typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(() => {
          if (resizeTimer) clearTimeout(resizeTimer);
          resizeTimer = setTimeout(renderGoogleButton, 100);
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
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeObserver?.disconnect();
      if (handleWindowResize) {
        window.removeEventListener('resize', handleWindowResize);
      }
      existingScript?.removeEventListener('load', initGoogle);
      lastRenderKeyRef.current = '';
    };
  }, [clientId, disabled]);

  if (!clientId) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-[11px] leading-6 text-amber-800 min-[360px]:px-4 min-[360px]:text-[13px]">
        Google sign-in needs <code className="font-semibold">NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> in{' '}
        <code className="font-semibold">.env.local</code>.
      </div>
    );
  }

  return (
    <div className={`w-full min-w-0 ${disabled ? 'pointer-events-none opacity-60' : ''}`}>
      <div
        ref={buttonRef}
        className={`flex min-h-[40px] w-full min-w-0 max-w-full overflow-hidden min-[360px]:min-h-[44px] ${align === 'left' ? 'justify-start' : 'justify-center'} [&>div]:!max-w-full [&>div]:!w-full [&_iframe]:!max-w-full`}
      />
    </div>
  );
}
