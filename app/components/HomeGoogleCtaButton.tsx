'use client';

import GoogleSignInButton from '@/app/components/GoogleSignInButton';

type HomeGoogleCtaButtonProps = {
  clientId: string;
  disabled?: boolean;
  onCredential: (credential: string) => void;
  onError: (message: string) => void;
};

function GoogleGLogo({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      className={className ?? 'h-[18px] w-[18px] shrink-0'}
      aria-hidden="true"
    >
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.59 2.96-2.26 5.48-4.78 7.18l7.73 6.01c4.51-4.18 7.09-10.36 7.09-17.66z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6.01c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

export default function HomeGoogleCtaButton({
  clientId,
  disabled = false,
  onCredential,
  onError,
}: HomeGoogleCtaButtonProps) {
  return (
    <div
      className={`relative h-10 w-full min-w-0 rounded-lg border border-[#DADCE0] bg-white shadow-[0_1px_2px_rgba(60,64,67,0.15)] min-[360px]:h-11 ${disabled ? 'pointer-events-none opacity-60' : ''}`}
    >
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center gap-2 px-2.5 min-[360px]:gap-2.5 min-[360px]:px-3">
        <GoogleGLogo className="h-4 w-4 shrink-0 min-[360px]:h-[18px] min-[360px]:w-[18px]" />
        <span className="whitespace-nowrap text-[12px] font-medium leading-normal text-[#3C4043] min-[360px]:text-[13px]">
          Continue with Google
        </span>
      </div>
      <div className="absolute inset-0 z-[1] h-full w-full min-w-0 cursor-pointer overflow-hidden rounded-lg opacity-0">
        <GoogleSignInButton
          clientId={clientId}
          align="left"
          overlay
          disabled={disabled}
          onCredential={onCredential}
          onError={onError}
        />
      </div>
    </div>
  );
}
