interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({
  placeholder = "חיפוש בתוכן...",
  value,
  onChange,
}: SearchBarProps) {
  return (
    <label className="flex w-full items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm text-white focus-within:ring-2 focus-within:ring-brand-accent">
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
      <span className="sr-only">חיפוש</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-right text-sm text-white placeholder:text-white/60 focus:outline-none"
        type="search"
        dir="rtl"
      />
    </label>
  );
}