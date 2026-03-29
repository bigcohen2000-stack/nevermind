"use client";

import { useCallback, useState, type KeyboardEvent, type ReactNode } from "react";

export type ThoughtRevealProps = {
  children: ReactNode;
};

/**
 * תובנה אחת מוסתרת עד לחיצה. טשטוש יורד בלבד, בלי אנימציות נוספות.
 */
export function ThoughtReveal({ children }: ThoughtRevealProps) {
  const [revealed, setRevealed] = useState(false);

  const toggle = useCallback(() => {
    setRevealed((v) => !v);
  }, []);

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggle();
      }
    },
    [toggle]
  );

  return (
    <div
      role="button"
      tabIndex={0}
      aria-expanded={revealed}
      onClick={toggle}
      onKeyDown={onKeyDown}
      className="cursor-pointer text-right"
    >
      <div
        className={`transition-[filter] duration-[400ms] ease ${revealed ? "[filter:blur(0)]" : "select-none [filter:blur(4px)]"}`}
      >
        {children}
      </div>
      {!revealed ? (
        <p className="mt-2 text-center text-[0.8rem] text-[#888]">לחץ כדי לחשוף</p>
      ) : null}
    </div>
  );
}
