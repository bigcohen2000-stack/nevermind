/** מפתח אתר ציבורי ל־hCaptcha. ריק בלי `PUBLIC_HCAPTCHA_SITE_KEY`. */
export const HCAPTCHA_SITE_KEY = String(import.meta.env.PUBLIC_HCAPTCHA_SITE_KEY ?? "").trim();
