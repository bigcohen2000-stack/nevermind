$ErrorActionPreference = "Stop"
$root = Join-Path (Join-Path $PSScriptRoot "..") "src"
$files = Get-ChildItem -Path $root -Recurse -Include *.astro, *.tsx, *.ts, *.jsx -File

foreach ($f in $files) {
  $c = [IO.File]::ReadAllText($f.FullName)
  $o = $c

  $c = [regex]::Replace($c, 'bg-\[var\(--nm-accent\)\]([^\"]*?)text-\[var\(--nm-inverse-fg\)\]', 'bg-[var(--nm-accent)]$1text-[var(--nm-on-accent)]')

  $c = [regex]::Replace($c, 'bg-\[var\(--nm-inverse\)\]([^\"]*?)text-white', 'bg-[var(--nm-inverse)]$1text-[var(--nm-inverse-fg)]')

  $c = $c.Replace('text-white transition hover:bg-[var(--nm-accent-hover)]', 'text-[var(--nm-on-accent)] transition hover:bg-[var(--nm-accent-hover)]')
  $c = $c.Replace('text-sm font-semibold text-white transition', 'text-sm font-semibold text-[var(--nm-on-accent)] transition')
  $c = $c.Replace('text-base font-semibold text-white transition', 'text-base font-semibold text-[var(--nm-on-accent)] transition')
  $c = $c.Replace('text-xs font-semibold text-white transition', 'text-xs font-semibold text-[var(--nm-on-accent)] transition')
  $c = $c.Replace('font-semibold text-white no-underline', 'font-semibold text-[var(--nm-on-accent)] no-underline')
  $c = $c.Replace('file:font-semibold file:text-white', 'file:font-semibold file:text-[var(--nm-inverse-fg)]')
  $c = $c.Replace('text-sm font-semibold text-white transition-colors', 'text-sm font-semibold text-[var(--nm-on-accent)] transition-colors')

  $c = $c.Replace('hover:bg-black', 'hover:bg-[var(--nm-inverse-hover)]')

  $c = $c.Replace('focus-visible:ring-[#1A1A1A]/20', 'focus-visible:ring-[color-mix(in_srgb,var(--nm-fg)_22%,transparent)]')
  $c = $c.Replace('focus:ring-[#D42B2B]/30', 'focus:ring-[color-mix(in_srgb,var(--nm-accent)_32%,transparent)]')
  $c = $c.Replace('focus-visible:ring-[#D42B2B]/20', 'focus-visible:ring-[color-mix(in_srgb,var(--nm-accent)_25%,transparent)]')
  $c = $c.Replace('hover:border-[#D42B2B]/25', 'hover:border-[color-mix(in_srgb,var(--nm-accent)_28%,transparent)]')

  $c = $c.Replace('border-[#1A1A1A]', 'border-[color-mix(in_srgb,var(--nm-fg)_22%,transparent)]')
  $c = $c.Replace('border-[#D42B2B]/12', 'border-[color-mix(in_srgb,var(--nm-accent)_14%,transparent)]')
  $c = $c.Replace('border-[#D42B2B]/10', 'border-[color-mix(in_srgb,var(--nm-accent)_12%,transparent)]')

  $c = $c.Replace('decoration-[#D42B2B]/30', 'decoration-[color-mix(in_srgb,var(--nm-accent)_35%,transparent)]')

  $c = $c.Replace('border-[#1A1A1A]/8', 'border-[color-mix(in_srgb,var(--nm-fg)_8%,transparent)]')
  $c = $c.Replace('border-[#1A1A1A]/16', 'border-[color-mix(in_srgb,var(--nm-fg)_16%,transparent)]')

  $c = $c.Replace('hover:border-[#D42B2B]/24', 'hover:border-[color-mix(in_srgb,var(--nm-accent)_26%,transparent)]')
  $c = $c.Replace('data-[selected=true]:border-[#D42B2B]/28', 'data-[selected=true]:border-[color-mix(in_srgb,var(--nm-accent)_30%,transparent)]')
  $c = $c.Replace('data-[selected=true]:bg-[#FFF7F6]', 'data-[selected=true]:bg-[var(--nm-tint)]')

  $c = $c.Replace('border-[#1D3557]/18', 'border-[color-mix(in_srgb,var(--nm-fg-secondary)_20%,transparent)]')

  $c = $c.Replace('dark:text-white"', 'dark:text-[var(--nm-fg)]"')

  $c = $c.Replace('border-[#1A1A1A]/25', 'border-[color-mix(in_srgb,var(--nm-fg)_25%,transparent)]')

  if ($c -ne $o) {
    [IO.File]::WriteAllText($f.FullName, $c, [Text.UTF8Encoding]::new($false))
    Write-Host "Patched $($f.Name)"
  }
}
Write-Host "Done fix2."
