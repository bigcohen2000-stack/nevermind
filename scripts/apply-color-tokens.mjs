/**
 * One-off migration: map legacy hex / red brand → semantic CSS variables.
 * Run: node scripts/apply-color-tokens.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.join(__dirname, "../src");

function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (/\.(astro|tsx|ts|jsx)$/.test(e.name)) acc.push(p);
  }
  return acc;
}

/** @type {Array<[RegExp, string]>} */
const replacers = [
  [/focus:ring-\[#D42B2B\]\/15/g, "focus:ring-[color-mix(in_srgb,var(--nm-accent)_20%,transparent)]"],
  [/focus:border-\[#D42B2B\]\/40/g, "focus:border-[color-mix(in_srgb,var(--nm-accent)_40%,transparent)]"],
  [/focus:border-\[#D42B2B\]\/35/g, "focus:border-[color-mix(in_srgb,var(--nm-accent)_35%,transparent)]"],
  [/hover:border-\[#D42B2B\]\/35/g, "hover:border-[color-mix(in_srgb,var(--nm-accent)_35%,transparent)]"],
  [/hover:border-\[#D42B2B\]\/20/g, "hover:border-[color-mix(in_srgb,var(--nm-accent)_22%,transparent)]"],
  [/border-\[#D42B2B\]\/45/g, "border-[color-mix(in_srgb,var(--nm-accent)_45%,transparent)]"],
  [/border-\[#D42B2B\]\/35/g, "border-[color-mix(in_srgb,var(--nm-accent)_35%,transparent)]"],
  [/border-\[#D42B2B\]\/18/g, "border-[color-mix(in_srgb,var(--nm-accent)_22%,transparent)]"],
  [/border-\[#D42B2B\]\/16/g, "border-[color-mix(in_srgb,var(--nm-accent)_20%,transparent)]"],
  [/border-\[#D42B2B\]\/14/g, "border-[color-mix(in_srgb,var(--nm-accent)_18%,transparent)]"],
  [/border-l-\[#D42B2B\]/g, "border-l-[var(--nm-accent)]"],
  [/group-hover:text-\[#D42B2B\]/g, "group-hover:text-[var(--nm-accent)]"],
  [/hover:text-\[#D42B2B\]/g, "hover:text-[var(--nm-accent)]"],
  [/hover:bg-\[#bc2727\]/g, "hover:bg-[var(--nm-accent-hover)]"],
  [/hover:bg-\[#b82424\]/g, "hover:bg-[var(--nm-accent-hover)]"],
  [/hover:bg-\[#ba2424\]/g, "hover:bg-[var(--nm-accent-hover)]"],
  [/hover:bg-\[#ffe7e5\]/g, "hover:bg-[var(--nm-tint-strong)]"],
  [/hover:bg-\[#FFF9F8\]/g, "hover:bg-[var(--nm-tint-hover)]"],
  [/bg-\[#D42B2B\]/g, "bg-[var(--nm-accent)]"],
  [/text-\[#D42B2B\]/g, "text-[var(--nm-accent)]"],
  [/bg-\[#FFF4F3\]/g, "bg-[var(--nm-tint)]"],
  [/accent-\[#D42B2B\]/g, "accent-[var(--nm-accent)]"],
  [/file:bg-\[#1A1A1A\]/g, "file:bg-[var(--nm-inverse)]"],
  [/hover:bg-\[#111111\]/g, "hover:bg-[var(--nm-inverse-hover)]"],
  [/bg-\[#111111\]/g, "bg-[var(--nm-code-bg)]"],
  [/text-\[#F4F4EF\]/g, "text-[var(--nm-code-fg)]"],
  [/border-\[#1A1A1A\]\/20/g, "border-[color-mix(in_srgb,var(--nm-fg)_20%,transparent)]"],
  [/border-\[#1A1A1A\]\/18/g, "border-[color-mix(in_srgb,var(--nm-fg)_18%,transparent)]"],
  [/border-\[#1A1A1A\]\/15/g, "border-[color-mix(in_srgb,var(--nm-fg)_15%,transparent)]"],
  [/border-\[#1A1A1A\]\/12/g, "border-[color-mix(in_srgb,var(--nm-fg)_12%,transparent)]"],
  [/border-\[#1A1A1A\]\/10/g, "border-[color-mix(in_srgb,var(--nm-fg)_10%,transparent)]"],
  [/border-\[#1A1A1A\]\/08/g, "border-[color-mix(in_srgb,var(--nm-fg)_8%,transparent)]"],
  [/border-t-\[#1A1A1A\]\/10/g, "border-t-[color-mix(in_srgb,var(--nm-fg)_10%,transparent)]"],
  [/border-b-\[#1A1A1A\]\/10/g, "border-b-[color-mix(in_srgb,var(--nm-fg)_10%,transparent)]"],
  [/border-e-\[#1A1A1A\]\/10/g, "border-e-[color-mix(in_srgb,var(--nm-fg)_10%,transparent)]"],
  [/hover:border-\[#1A1A1A\]\/25/g, "hover:border-[color-mix(in_srgb,var(--nm-fg)_25%,transparent)]"],
  [/focus-visible:ring-\[#1A1A1A\]\/25/g, "focus-visible:ring-[color-mix(in_srgb,var(--nm-inverse)_28%,transparent)]"],
  [/focus:ring-\[#1A1A1A\]\/25/g, "focus:ring-[color-mix(in_srgb,var(--nm-inverse)_28%,transparent)]"],
  [/open:border-\[#1A1A1A\]\/18/g, "open:border-[color-mix(in_srgb,var(--nm-fg)_18%,transparent)]"],
  [/bg-\[#1A1A1A\]/g, "bg-[var(--nm-inverse)]"],
  [/text-\[#1A1A1A\]\/90/g, "text-[color-mix(in_srgb,var(--nm-fg)_90%,var(--nm-bg))]"],
  [/text-\[#1A1A1A\]\/88/g, "text-[color-mix(in_srgb,var(--nm-fg)_88%,var(--nm-bg))]"],
  [/text-\[#1A1A1A\]\/85/g, "text-[color-mix(in_srgb,var(--nm-fg)_85%,var(--nm-bg))]"],
  [/text-\[#1A1A1A\]\/82/g, "text-[color-mix(in_srgb,var(--nm-fg)_82%,var(--nm-bg))]"],
  [/text-\[#1A1A1A\]\/78/g, "text-[color-mix(in_srgb,var(--nm-fg)_78%,var(--nm-bg))]"],
  [/text-\[#1A1A1A\]\/76/g, "text-[color-mix(in_srgb,var(--nm-fg)_76%,var(--nm-bg))]"],
  [/text-\[#1A1A1A\]\/72/g, "text-[color-mix(in_srgb,var(--nm-fg)_72%,var(--nm-bg))]"],
  [/text-\[#1A1A1A\]\/70/g, "text-[color-mix(in_srgb,var(--nm-fg)_70%,var(--nm-bg))]"],
  [/text-\[#1A1A1A\]\/68/g, "text-[color-mix(in_srgb,var(--nm-fg)_68%,var(--nm-bg))]"],
  [/text-\[#1A1A1A\]\/66/g, "text-[color-mix(in_srgb,var(--nm-fg)_66%,var(--nm-bg))]"],
  [/text-\[#1A1A1A\]\/64/g, "text-[color-mix(in_srgb,var(--nm-fg)_64%,var(--nm-bg))]"],
  [/text-\[#1A1A1A\]\/60/g, "text-[color-mix(in_srgb,var(--nm-fg)_60%,var(--nm-bg))]"],
  [/text-\[#1A1A1A\]\/58/g, "text-[color-mix(in_srgb,var(--nm-fg)_58%,var(--nm-bg))]"],
  [/text-\[#1A1A1A\]\/55/g, "text-[color-mix(in_srgb,var(--nm-fg)_55%,var(--nm-bg))]"],
  [/text-\[#1A1A1A\]\/50/g, "text-[color-mix(in_srgb,var(--nm-fg)_50%,var(--nm-bg))]"],
  [/text-\[#1A1A1A\]\/45/g, "text-[color-mix(in_srgb,var(--nm-fg)_45%,var(--nm-bg))]"],
  [/text-\[#1A1A1A\]\/40/g, "text-[color-mix(in_srgb,var(--nm-fg)_40%,var(--nm-bg))]"],
  [/placeholder:text-\[#1A1A1A\]\/40/g, "placeholder:text-[color-mix(in_srgb,var(--nm-fg)_40%,var(--nm-bg))]"],
  [/text-\[#1A1A1A\]/g, "text-[var(--nm-fg)]"],
  [/accent-\[#1A1A1A\]/g, "accent-[var(--nm-inverse)]"],
  [/bg-\[#FAFAF8\]/g, "bg-[var(--nm-surface-muted)]"],
  [/hover:bg-\[#FAFAF8\]/g, "hover:bg-[var(--nm-surface-muted)]"],
  [/from-\[#FAFAF8\]/g, "from-[var(--nm-surface-muted)]"],
  [/to-\[#FAFAF8\]/g, "to-[var(--nm-surface-muted)]"],
  [/text-\[#FAFAF8\]/g, "text-[var(--nm-inverse-fg)]"],
  [/dark:text-\[#FAFAF8\]/g, "dark:text-[var(--nm-fg)]"],
  [/dark:text-\[#F5F5F5\]/g, "dark:text-[var(--nm-fg)]"],
  [/border-\[#1D3557\]\/14/g, "border-[color-mix(in_srgb,var(--nm-fg-secondary)_16%,transparent)]"],
  [/border-\[#1D3557\]\/12/g, "border-[color-mix(in_srgb,var(--nm-fg-secondary)_14%,transparent)]"],
  [/text-\[#1D3557\]\/70/g, "text-[color-mix(in_srgb,var(--nm-fg-secondary)_75%,var(--nm-bg))]"],
  [/text-\[#1D3557\]\/65/g, "text-[color-mix(in_srgb,var(--nm-fg-secondary)_70%,var(--nm-bg))]"],
  [/text-\[#1D3557\]\/60/g, "text-[color-mix(in_srgb,var(--nm-fg-secondary)_65%,var(--nm-bg))]"],
  [/text-\[#1D3557\]/g, "text-[var(--nm-fg-secondary)]"],
  [/shadow-\[0_18px_50px_rgba\(29,53,87,0\.07\)\]/g, "shadow-[0_18px_50px_color-mix(in_srgb,var(--nm-fg-secondary)_8%,transparent)]"],
  [/shadow-\[0_22px_60px_rgba\(212,43,43,0\.12\)\]/g, "shadow-[0_22px_60px_color-mix(in_srgb,var(--nm-accent)_12%,transparent)]"],
  [/hover:shadow-\[0_22px_60px_rgba\(212,43,43,0\.12\)\]/g, "hover:shadow-[0_22px_60px_color-mix(in_srgb,var(--nm-accent)_12%,transparent)]"],
  [/shadow-\[0_24px_80px_rgba\(212,43,43,0\.08\)\]/g, "shadow-[0_24px_80px_color-mix(in_srgb,var(--nm-accent)_10%,transparent)]"],
  [/rgba\(212,\s*43,\s*43/g, "rgba(249, 115, 22"],
  [/rgba\(232,\s*121,\s*121/g, "rgba(251, 146, 60"],
  [/rgba\(248,\s*113,\s*113/g, "rgba(253, 186, 116"],
  [/rgba\(60,\s*20,\s*20/g, "rgba(15, 23, 42"],
];

for (const file of walk(srcDir)) {
  let c = fs.readFileSync(file, "utf8");
  const original = c;
  for (const [re, rep] of replacers) {
    c = c.replace(re, rep);
  }
  if (c !== original) fs.writeFileSync(file, c, "utf8");
}

console.log("Color token migration applied under src/");
