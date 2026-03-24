/// <reference types="astro/client" />

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
