$ErrorActionPreference = "Stop"
$root = Join-Path (Join-Path $PSScriptRoot "..") "src"
$exts = @("*.astro", "*.tsx", "*.ts", "*.jsx")
$files = foreach ($e in $exts) { Get-ChildItem -Path $root -Recurse -Filter $e -File }

$pairs = @(
  @('focus:ring-[#D42B2B]/15', 'focus:ring-[color-mix(in_srgb,var(--nm-accent)_20%,transparent)]'),
  @('focus:border-[#D42B2B]/40', 'focus:border-[color-mix(in_srgb,var(--nm-accent)_40%,transparent)]'),
  @('focus:border-[#D42B2B]/35', 'focus:border-[color-mix(in_srgb,var(--nm-accent)_35%,transparent)]'),
  @('hover:border-[#D42B2B]/35', 'hover:border-[color-mix(in_srgb,var(--nm-accent)_35%,transparent)]'),
  @('hover:border-[#D42B2B]/20', 'hover:border-[color-mix(in_srgb,var(--nm-accent)_22%,transparent)]'),
  @('border-[#D42B2B]/45', 'border-[color-mix(in_srgb,var(--nm-accent)_45%,transparent)]'),
  @('border-[#D42B2B]/35', 'border-[color-mix(in_srgb,var(--nm-accent)_35%,transparent)]'),
  @('border-[#D42B2B]/18', 'border-[color-mix(in_srgb,var(--nm-accent)_22%,transparent)]'),
  @('border-[#D42B2B]/16', 'border-[color-mix(in_srgb,var(--nm-accent)_20%,transparent)]'),
  @('border-[#D42B2B]/14', 'border-[color-mix(in_srgb,var(--nm-accent)_18%,transparent)]'),
  @('border-l-[#D42B2B]', 'border-l-[var(--nm-accent)]'),
  @('group-hover:text-[#D42B2B]', 'group-hover:text-[var(--nm-accent)]'),
  @('hover:text-[#D42B2B]', 'hover:text-[var(--nm-accent)]'),
  @('hover:bg-[#bc2727]', 'hover:bg-[var(--nm-accent-hover)]'),
  @('hover:bg-[#b82424]', 'hover:bg-[var(--nm-accent-hover)]'),
  @('hover:bg-[#ba2424]', 'hover:bg-[var(--nm-accent-hover)]'),
  @('hover:bg-[#ffe7e5]', 'hover:bg-[var(--nm-tint-strong)]'),
  @('hover:bg-[#FFF9F8]', 'hover:bg-[var(--nm-tint-hover)]'),
  @('bg-[#D42B2B]', 'bg-[var(--nm-accent)]'),
  @('text-[#D42B2B]', 'text-[var(--nm-accent)]'),
  @('bg-[#FFF4F3]', 'bg-[var(--nm-tint)]'),
  @('accent-[#D42B2B]', 'accent-[var(--nm-accent)]'),
  @('file:bg-[#1A1A1A]', 'file:bg-[var(--nm-inverse)]'),
  @('hover:bg-[#111111]', 'hover:bg-[var(--nm-inverse-hover)]'),
  @('bg-[#111111]', 'bg-[var(--nm-code-bg)]'),
  @('text-[#F4F4EF]', 'text-[var(--nm-code-fg)]'),
  @('border-[#1A1A1A]/20', 'border-[color-mix(in_srgb,var(--nm-fg)_20%,transparent)]'),
  @('border-[#1A1A1A]/18', 'border-[color-mix(in_srgb,var(--nm-fg)_18%,transparent)]'),
  @('border-[#1A1A1A]/15', 'border-[color-mix(in_srgb,var(--nm-fg)_15%,transparent)]'),
  @('border-[#1A1A1A]/12', 'border-[color-mix(in_srgb,var(--nm-fg)_12%,transparent)]'),
  @('border-[#1A1A1A]/10', 'border-[color-mix(in_srgb,var(--nm-fg)_10%,transparent)]'),
  @('border-[#1A1A1A]/08', 'border-[color-mix(in_srgb,var(--nm-fg)_8%,transparent)]'),
  @('border-t-[#1A1A1A]/10', 'border-t-[color-mix(in_srgb,var(--nm-fg)_10%,transparent)]'),
  @('border-b-[#1A1A1A]/10', 'border-b-[color-mix(in_srgb,var(--nm-fg)_10%,transparent)]'),
  @('border-e-[#1A1A1A]/10', 'border-e-[color-mix(in_srgb,var(--nm-fg)_10%,transparent)]'),
  @('hover:border-[#1A1A1A]/25', 'hover:border-[color-mix(in_srgb,var(--nm-fg)_25%,transparent)]'),
  @('focus-visible:ring-[#1A1A1A]/25', 'focus-visible:ring-[color-mix(in_srgb,var(--nm-inverse)_28%,transparent)]'),
  @('focus:ring-[#1A1A1A]/25', 'focus:ring-[color-mix(in_srgb,var(--nm-inverse)_28%,transparent)]'),
  @('open:border-[#1A1A1A]/18', 'open:border-[color-mix(in_srgb,var(--nm-fg)_18%,transparent)]'),
  @('bg-[#1A1A1A]', 'bg-[var(--nm-inverse)]'),
  @('text-[#1A1A1A]/90', 'text-[color-mix(in_srgb,var(--nm-fg)_90%,var(--nm-bg))]'),
  @('text-[#1A1A1A]/88', 'text-[color-mix(in_srgb,var(--nm-fg)_88%,var(--nm-bg))]'),
  @('text-[#1A1A1A]/85', 'text-[color-mix(in_srgb,var(--nm-fg)_85%,var(--nm-bg))]'),
  @('text-[#1A1A1A]/82', 'text-[color-mix(in_srgb,var(--nm-fg)_82%,var(--nm-bg))]'),
  @('text-[#1A1A1A]/78', 'text-[color-mix(in_srgb,var(--nm-fg)_78%,var(--nm-bg))]'),
  @('text-[#1A1A1A]/76', 'text-[color-mix(in_srgb,var(--nm-fg)_76%,var(--nm-bg))]'),
  @('text-[#1A1A1A]/72', 'text-[color-mix(in_srgb,var(--nm-fg)_72%,var(--nm-bg))]'),
  @('text-[#1A1A1A]/70', 'text-[color-mix(in_srgb,var(--nm-fg)_70%,var(--nm-bg))]'),
  @('text-[#1A1A1A]/68', 'text-[color-mix(in_srgb,var(--nm-fg)_68%,var(--nm-bg))]'),
  @('text-[#1A1A1A]/66', 'text-[color-mix(in_srgb,var(--nm-fg)_66%,var(--nm-bg))]'),
  @('text-[#1A1A1A]/64', 'text-[color-mix(in_srgb,var(--nm-fg)_64%,var(--nm-bg))]'),
  @('text-[#1A1A1A]/60', 'text-[color-mix(in_srgb,var(--nm-fg)_60%,var(--nm-bg))]'),
  @('text-[#1A1A1A]/58', 'text-[color-mix(in_srgb,var(--nm-fg)_58%,var(--nm-bg))]'),
  @('text-[#1A1A1A]/55', 'text-[color-mix(in_srgb,var(--nm-fg)_55%,var(--nm-bg))]'),
  @('text-[#1A1A1A]/50', 'text-[color-mix(in_srgb,var(--nm-fg)_50%,var(--nm-bg))]'),
  @('text-[#1A1A1A]/45', 'text-[color-mix(in_srgb,var(--nm-fg)_45%,var(--nm-bg))]'),
  @('text-[#1A1A1A]/40', 'text-[color-mix(in_srgb,var(--nm-fg)_40%,var(--nm-bg))]'),
  @('placeholder:text-[#1A1A1A]/40', 'placeholder:text-[color-mix(in_srgb,var(--nm-fg)_40%,var(--nm-bg))]'),
  @('text-[#1A1A1A]', 'text-[var(--nm-fg)]'),
  @('accent-[#1A1A1A]', 'accent-[var(--nm-inverse)]'),
  @('bg-[#FAFAF8]', 'bg-[var(--nm-surface-muted)]'),
  @('hover:bg-[#FAFAF8]', 'hover:bg-[var(--nm-surface-muted)]'),
  @('from-[#FAFAF8]', 'from-[var(--nm-surface-muted)]'),
  @('to-[#FAFAF8]', 'to-[var(--nm-surface-muted)]'),
  @('text-[#FAFAF8]', 'text-[var(--nm-inverse-fg)]'),
  @('dark:text-[#FAFAF8]', 'dark:text-[var(--nm-fg)]'),
  @('dark:text-[#F5F5F5]', 'dark:text-[var(--nm-fg)]'),
  @('border-[#1D3557]/14', 'border-[color-mix(in_srgb,var(--nm-fg-secondary)_16%,transparent)]'),
  @('border-[#1D3557]/12', 'border-[color-mix(in_srgb,var(--nm-fg-secondary)_14%,transparent)]'),
  @('text-[#1D3557]/70', 'text-[color-mix(in_srgb,var(--nm-fg-secondary)_75%,var(--nm-bg))]'),
  @('text-[#1D3557]/65', 'text-[color-mix(in_srgb,var(--nm-fg-secondary)_70%,var(--nm-bg))]'),
  @('text-[#1D3557]/60', 'text-[color-mix(in_srgb,var(--nm-fg-secondary)_65%,var(--nm-bg))]'),
  @('text-[#1D3557]', 'text-[var(--nm-fg-secondary)]'),
  @('shadow-[0_18px_50px_rgba(29,53,87,0.07)]', 'shadow-[0_18px_50px_color-mix(in_srgb,var(--nm-fg-secondary)_8%,transparent)]'),
  @('shadow-[0_22px_60px_rgba(212,43,43,0.12)]', 'shadow-[0_22px_60px_color-mix(in_srgb,var(--nm-accent)_12%,transparent)]'),
  @('hover:shadow-[0_22px_60px_rgba(212,43,43,0.12)]', 'hover:shadow-[0_22px_60px_color-mix(in_srgb,var(--nm-accent)_12%,transparent)]'),
  @('shadow-[0_24px_80px_rgba(212,43,43,0.08)]', 'shadow-[0_24px_80px_color-mix(in_srgb,var(--nm-accent)_10%,transparent)]'),
  @('rgba(212, 43, 43', 'rgba(249, 115, 22'),
  @('rgba(232, 121, 121', 'rgba(251, 146, 60'),
  @('rgba(248, 113, 113', 'rgba(253, 186, 116'),
  @('rgba(60, 20, 20', 'rgba(15, 23, 42')
)

foreach ($f in $files) {
  $c = [IO.File]::ReadAllText($f.FullName)
  $o = $c
  foreach ($p in $pairs) {
    $c = $c.Replace($p[0], $p[1])
  }
  if ($c -ne $o) {
    [IO.File]::WriteAllText($f.FullName, $c, [Text.UTF8Encoding]::new($false))
    Write-Host "Updated $($f.FullName)"
  }
}
Write-Host "Done."
