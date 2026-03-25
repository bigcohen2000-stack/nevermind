import type { ReactNode } from "react";

type TruthBlockProps = {
  children: ReactNode;
  label?: string;
};

/**
 * בלוק תובנה חדה לשבירת טקסט ארוך.
 * ביצירת דף: אם יש יותר מארבע פסקאות בגוף, הוסף TruthBlock אחרי הפסקה השנייה או השלישית.
 */
export default function TruthBlock({ children, label }: TruthBlockProps) {
  return (
    <aside
      className="my-8 rounded-l-none rounded-r-sm border-y-0 border-r-0 border-l-[1.5px] border-solid border-[var(--color-red)] bg-transparent py-[1rem] ps-[1.25rem] pe-[1.25rem] text-right"
      dir="rtl"
    >
      {label ? (
        <p className="mb-2 text-[0.7rem] font-medium uppercase tracking-[0.08em] text-[var(--color-red)]">
          {label}
        </p>
      ) : null}
      <div className="text-[0.95rem] font-normal leading-[1.7] text-[var(--color-black)]">{children}</div>
    </aside>
  );
}
