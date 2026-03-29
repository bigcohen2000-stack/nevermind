/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_NM_CLUB_WEBHOOK_URL?: string;
  readonly PUBLIC_WEB3FORMS_ACCESS_KEY?: string;
  readonly PUBLIC_CLIENT_LOG_URL?: string;
  readonly PUBLIC_WHATSAPP_NUMBER?: string;
  readonly NEXT_PUBLIC_WHATSAPP_NUMBER?: string;
  readonly PUBLIC_CONTACT_EMAIL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  __nmArticleCleanup?: () => void;
  __nmAnnounce?: (message: string) => void;
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
