# Admin PWA Guide - NeverMind

## Overview
מדריך זה מתאר את כל השלבים בהקמת ופריסת מערכת Admin PWA מבוססת Astro + Cloudflare.

## Local setup
1. התקן Node 20+.
2. git clone <repo-url>
3. `npm ci`
4. `npm run dev`
5. גלוש ל-`http://localhost:3000/admin/login`.

### quick sanity checks
- `viewer/view123` נכנס ובדף dashboards.
- `editor/edit456` רואה מאמרים ו-services.
- `admin/admin789` רואה settings + users.

## Auth + RBAC
- בניית backend endpoint `/api/admin/login`:
  - במענה תקין מחזיר JWT.
  - cookie HttpOnly Secure.
- RBAC roles:
  - viewer, editor, admin.
- client-side flow:
  - login → localStorage session
  - RoleGate ב-`/admin/index` ו־subpages.
- logout מפרק session, ממיר ל`/admin/login`.

## PWA configuration
- `public/admin-manifest.json` (`scope: /admin/`).
- `public/admin-sw.js`:
  - cache asset list
  - offline fallback
  - fetch handler (cache first, network fallback)

- `window.addEventListener('beforeinstallprompt', ...)` ב-`/admin/login`.

## Cloudflare deployment
1. `wrangler.toml` או Cloudflare Pages config
2. route: `admin.nevermind.co.il/*` -> project
3. SSL/TLS full strict
4. page rules: HTTPS always, no query cache

## Monitoring
- Sentry/Logflare + Cloudflare metrics.
- Alerts:
  - 5xx > 2%
  - 401/403 > 3%

## Security checkpoints
- rate limit login (5/min)
- CSRF token באינטראקציה של `POST/PUT/DELETE`.
- Content Security Policy.

## Performance goals
- TTFB < 200ms
- LCP < 2.5s
- cache hit ratio > 80%

## QA tests
1. front-end manual + API tests ב-Postman/Insomnia.
2. local offline עם network disconnect.
3. session timeout (12h) + logout force.

## Disaster recovery
- backup DB לפני רצונינ' release.
- feature-flag disconnect.
- rollback branch `main`/stable.
