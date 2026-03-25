/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_CLIENT_LOG_URL?: string;
  readonly PUBLIC_WHATSAPP_NUMBER?: string;
  readonly NEXT_PUBLIC_WHATSAPP_NUMBER?: string;
  readonly PUBLIC_CONTACT_EMAIL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
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
