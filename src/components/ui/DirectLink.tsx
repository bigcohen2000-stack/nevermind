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
 * קריאה ישירה לוואטסאפ עם הקשר עמוד (כותרת + URL).
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
      className={`group inline-flex items-center justify-center gap-2 rounded-full bg-[var(--nm-whatsapp)] px-[1.25rem] py-[0.75rem] text-[0.95rem] font-semibold leading-normal text-white shadow-[0_10px_24px_rgba(37,211,102,0.22)] transition-all duration-200 [transition-timing-function:ease] hover:-translate-y-0.5 hover:bg-[var(--nm-whatsapp-hover)] hover:shadow-[0_14px_28px_rgba(37,211,102,0.28)] active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--nm-whatsapp)] ${className}`.trim()}
      aria-label="יש לך מחשבה על זה? בוא נדבר בוואטסאפ"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className="transition-transform duration-200 group-hover:scale-110"
      >
        <path
          d="M20 12a8 8 0 0 1-8 8c-1.2 0-2.35-.3-3.37-.86L4 20l.86-4.63A8 8 0 1 1 20 12Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
          opacity="1"
        />
        <path
          d="M10 9c.8 2 2 3 4 4"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      יש לך מחשבה על זה? בוא נדבר
    </button>
  );
}
