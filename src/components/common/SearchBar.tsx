import { Search } from "lucide-react";

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
      <Search className="h-4 w-4 text-white/70" aria-hidden="true" />
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