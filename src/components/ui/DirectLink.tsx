"use client";

import { useCallback } from "react";

function digitsOnly(phone: string): string {
  return String(phone ?? "").replace(/\D/g, "");
}

export type DirectLinkProps = {
  /**
   * גיבוי כש־PUBLIC_WHATSAPP_NUMBER לא מוגדר בבנייה (למשל מ־appConfig בצד שרת).
   * בפרויקט Astro משתמשים ב־import.meta.env.PUBLIC_WHATSAPP_NUMBER (מקביל ל־NEXT_PUBLIC ב־Next).
   */
  whatsAppNumber?: string;
  /** כשאין מספר וואטסאפ: mailto עם נושא וגוף לפי עמוד */
  fallbackEmail?: string;
  className?: string;
};

/**
 * קריאה ישירה לוואטסאפ עם הקשר עמוד (כותרת + URL). בלי אייקונים.
 */
export function DirectLink({ whatsAppNumber, fallbackEmail, className = "" }: DirectLinkProps) {
  const handleClick = useCallback(() => {
    if (typeof document === "undefined" || typeof window === "undefined") return;

    const pageTitle = document.title;
    const pageUrl = window.location.href;
    const message = encodeURIComponent(`היי, קראתי את "${pageTitle}" ויש לי מחשבה על זה - ${pageUrl}`);

    const envRawWhatsApp =
      typeof import.meta !== "undefined" && import.meta.env
        ? String(
            (import.meta.env as unknown as { PUBLIC_WHATSAPP_NUMBER?: string }).PUBLIC_WHATSAPP_NUMBER ??
              (import.meta.env as unknown as { NEXT_PUBLIC_WHATSAPP_NUMBER?: string }).NEXT_PUBLIC_WHATSAPP_NUMBER ??
              ""
          )
        : "";
    const phoneDigits = digitsOnly(envRawWhatsApp) || digitsOnly(whatsAppNumber ?? "");

    if (phoneDigits) {
      window.open(`https://wa.me/${phoneDigits}?text=${message}`, "_blank", "noopener,noreferrer");
      return;
    }

    const envEmail =
      typeof import.meta !== "undefined" && import.meta.env?.PUBLIC_CONTACT_EMAIL != null
        ? String(import.meta.env.PUBLIC_CONTACT_EMAIL).trim()
        : "";
    const email = envEmail || String(fallbackEmail ?? "").trim();
    if (email) {
      const subject = encodeURIComponent(`מחשבה אחרי קריאה: ${pageTitle}`);
      const body = encodeURIComponent(`היי,\n\nקראתי את "${pageTitle}" ויש לי מחשבה על זה.\n\n${pageUrl}`);
      window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
    }
  }, [whatsAppNumber, fallbackEmail]);

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex items-center justify-center rounded-full bg-[#25D366] px-[1.25rem] py-[0.75rem] text-[0.95rem] font-semibold leading-normal text-white transition-colors duration-200 [transition-timing-function:ease] hover:bg-[#1FAE55] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366] ${className}`.trim()}
    >
      יש לך מחשבה על זה? בוא נדבר
    </button>
  );
}
