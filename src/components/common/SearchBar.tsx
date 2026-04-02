import { FloatingInput } from "../ui/FloatingInput";

interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ placeholder = "חיפוש בתוכן...", value, onChange }: SearchBarProps) {
  return (
    <div className="flex w-full items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm text-white focus-within:ring-2 focus-within:ring-brand-accent">
      <svg
        className="h-4 w-4 shrink-0 text-white/70"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <FloatingInput
        id="nm-search-bar-field"
        label={placeholder}
        type="search"
        value={value}
        onChange={onChange}
        hideValidation
        dir="rtl"
        className="flex-1 [&_.nm-floating-control]:min-h-0 [&_.nm-floating-control]:border-white/25 [&_.nm-floating-control]:bg-transparent [&_.nm-floating-control]:py-1 [&_.nm-floating-control]:text-sm [&_.nm-floating-control]:text-white [&_.nm-floating-label]:text-white/75"
      />
    </div>
  );
}
