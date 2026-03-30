/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_NM_CLUB_WEBHOOK_URL?: string;
  readonly PUBLIC_HCAPTCHA_SITE_KEY?: string;
  readonly PUBLIC_WEB3FORMS_ACCESS_KEY?: string;
  readonly PUBLIC_CLIENT_LOG_URL?: string;
  readonly PUBLIC_WHATSAPP_NUMBER?: string;
  readonly NEXT_PUBLIC_WHATSAPP_NUMBER?: string;
  readonly PUBLIC_CONTACT_EMAIL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

type NmClubSession = {
  memberName: string;
  phone: string;
  expiresAt: string;
  lastLoginAt?: string;
  fraudFlag?: boolean;
  liveStatus?: string;
};

interface Window {
  __nmArticleCleanup?: () => void;
  __nmAnnounce?: (message: string) => void;
  __nmHapticLight?: () => void;
  __nmHapticSuccess?: () => void;
  __nmSetButtonLoading?: (target: HTMLElement, label?: string) => void;
  __nmClearButtonLoading?: (target: HTMLElement) => void;
  __nmReadClubSession?: () => NmClubSession | null;
  __nmClearClubSession?: () => void;
  __nmLayoutCleanup?: () => void;
  __nmMountHcaptcha?: (form: HTMLFormElement) => () => void;
  __nmHcaptchaOk?: (form: HTMLFormElement) => boolean;
  __nmHcaptchaGlobalsRegistered?: boolean;
  __nmHcaptchaApiPromise?: Promise<void> | null;
  __nmLoadHcaptchaApi?: () => Promise<void>;
  __nmDiscoveryPageLoadBound?: boolean;
  __nmSearchPageLoadBound?: boolean;
  __nmSearchPageCleanup?: () => void;
  __nmServicesDiscoveryCleanup?: () => void;
  nmTrackEvent?: (name: string, params?: Record<string, unknown>) => void;
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
  hcaptcha?: {
    render: (
      container: HTMLElement,
      params: Record<string, unknown>,
    ) => number;
    remove: (widgetId: number) => void;
  };
}

declare namespace astroHTML.JSX {
  interface IntrinsicElements {
    "lite-youtube": {
      videoid: string;
      playlabel?: string;
      title?: string;
      params?: string;
      class?: string;
    };
  }
}
