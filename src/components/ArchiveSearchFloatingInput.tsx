import type { ReactNode } from "react";
import { FloatingInput } from "./ui/FloatingInput";

const searchGlyph = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <path
      d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Zm0-2a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11Z"
      fill="currentColor"
    />
    <path d="M15.446 15.854 20 20.408l-1.408 1.408-4.554-4.554 1.408-1.408Z" fill="currentColor" />
  </svg>
);

type Props = {
  id: string;
  label: string;
  pagefindInput?: boolean;
  autoFocus?: boolean;
  /** ערך התחלתי (למשל מפרמטר ?q= בדף חיפוש) */
  defaultValue?: string;
  className?: string;
  fieldInnerEnd?: ReactNode;
  fieldPaddingEndClass?: string;
};

export function ArchiveSearchFloatingInput({
  id,
  label,
  pagefindInput,
  autoFocus,
  defaultValue,
  className,
  fieldInnerEnd,
  fieldPaddingEndClass = "pr-12",
}: Props) {
  return (
    <FloatingInput
      id={id}
      type="search"
      label={label}
      autoComplete="off"
      dir="rtl"
      hideValidation
      pagefindInput={pagefindInput}
      autoFocus={autoFocus}
      defaultValue={defaultValue}
      className={className}
      fieldInnerEnd={fieldInnerEnd ?? searchGlyph}
      fieldPaddingEndClass={fieldPaddingEndClass}
      aria-label="מה מעסיק אותך כרגע? | חיפוש במרכז הידע של השם לא משנה"
    />
  );
}
