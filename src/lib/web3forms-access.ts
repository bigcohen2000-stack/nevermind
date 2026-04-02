/** מפתח Web3Forms. נחשף לדפדפן רק אם הוגדר PUBLIC_WEB3FORMS_ACCESS_KEY בפריסה. */
export const WEB3FORMS_ACCESS_KEY = String(import.meta.env.PUBLIC_WEB3FORMS_ACCESS_KEY ?? "").trim();
export const WEB3FORMS_ENABLED = WEB3FORMS_ACCESS_KEY.length > 0;