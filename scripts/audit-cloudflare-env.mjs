#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const PACKAGE_JSON_PATH = path.join(ROOT, "package.json");

const readEnv = (key) => {
  const value = process.env[key];
  return typeof value === "string" ? value.trim() : "";
};

const boolFlag = (value) => value.toLowerCase() === "true" || value === "1";

const pagesSpecs = [
  {
    name: "PREMIUM_SESSION_SECRET",
    scope: "Pages",
    kind: "secret",
    requirement: "required",
    note: "חותם עוגיית premium ו-fragment requests",
    validate(value) {
      return value.length >= 16 ? null : "צריך מינימום 16 תווים";
    },
  },
  {
    name: "WEB3FORMS_ACCESS_KEY",
    scope: "Pages",
    kind: "secret",
    requirement: "required",
    note: "טפסי יצירת קשר דרך Web3Forms",
  },
  {
    name: "PUBLIC_NM_CLUB_WEBHOOK_URL",
    scope: "Pages",
    kind: "public",
    requirement: "recommended",
    note: "כתובת login של Worker למועדון",
    validate(value) {
      return /^https:\/\//i.test(value) ? null : "צריך להתחיל ב-https://";
    },
  },
  {
    name: "PUBLIC_CLUB_ADMIN_VIA_PROXY",
    scope: "Pages",
    kind: "public",
    requirement: "recommended",
    note: "מפעיל ניהול דרך /api/club-admin במקום JWT בדפדפן",
  },
  {
    name: "NM_CLUB_AUTH_BASE_URL",
    scope: "Pages",
    kind: "plain",
    requirement: "conditional",
    note: "כתובת הבסיס של Worker עבור admin proxy",
    when(env) {
      return boolFlag(env.PUBLIC_CLUB_ADMIN_VIA_PROXY || "");
    },
    validate(value) {
      return /^https:\/\//i.test(value) ? null : "צריך להתחיל ב-https://";
    },
  },
  {
    name: "NM_CLUB_ADMIN_SERVICE_KEY",
    scope: "Pages",
    kind: "secret",
    requirement: "conditional",
    note: "סוד משותף בין Pages ל-Worker עבור admin proxy",
    when(env) {
      return boolFlag(env.PUBLIC_CLUB_ADMIN_VIA_PROXY || "");
    },
  },
  {
    name: "PSI_API_KEY",
    scope: "Pages",
    kind: "secret",
    requirement: "optional",
    note: "PageSpeed dashboard API",
    alternatives: ["GOOGLE_PAGESPEED_API_KEY"],
  },
  {
    name: "GOOGLE_PAGESPEED_API_KEY",
    scope: "Pages",
    kind: "secret",
    requirement: "optional",
    note: "alias ל-PSI_API_KEY",
    alternatives: ["PSI_API_KEY"],
  },
  {
    name: "CF_ZONE_ID",
    scope: "Pages",
    kind: "secret",
    requirement: "optional",
    note: "נדרש ל-purge cache מהדשבורד",
  },
  {
    name: "CF_API_TOKEN",
    scope: "Pages",
    kind: "secret",
    requirement: "optional",
    note: "נדרש ל-purge cache מהדשבורד",
  },
  {
    name: "GITHUB_CLIENT_ID",
    scope: "Pages",
    kind: "secret",
    requirement: "optional",
    note: "Decap / GitHub OAuth",
  },
  {
    name: "GITHUB_CLIENT_SECRET",
    scope: "Pages",
    kind: "secret",
    requirement: "optional",
    note: "Decap / GitHub OAuth",
  },
  {
    name: "GITHUB_OAUTH_SCOPE",
    scope: "Pages",
    kind: "plain",
    requirement: "optional",
    note: "ברירת מחדל בקוד: repo",
  },
  {
    name: "PUBLIC_GA_MEASUREMENT_ID",
    scope: "Pages",
    kind: "public",
    requirement: "optional",
    note: "טעינת GA4 בצד לקוח",
  },
  {
    name: "GA4_MEASUREMENT_ID",
    scope: "Pages",
    kind: "plain",
    requirement: "optional",
    note: "דיווח premium unlock בצד שרת",
  },
  {
    name: "GA4_API_SECRET",
    scope: "Pages",
    kind: "secret",
    requirement: "optional",
    note: "דיווח premium unlock בצד שרת",
  },
  {
    name: "ANALYTICS_PREMIUM_WEBHOOK_URL",
    scope: "Pages",
    kind: "plain",
    requirement: "optional",
    note: "Webhook חלופי ל-premium unlock analytics",
  },
  {
    name: "PUBLIC_HCAPTCHA_SITE_KEY",
    scope: "Pages",
    kind: "public",
    requirement: "optional",
    note: "הפעלת hCaptcha בטפסים",
  },
  {
    name: "PUBLIC_CLIENT_LOG_URL",
    scope: "Pages",
    kind: "public",
    requirement: "optional",
    note: "דיווח שגיאות client-side",
  },
];

const workerSpecs = [
  {
    name: "CLUB_IP_PEPPER",
    scope: "Worker",
    kind: "secret",
    requirement: "required",
    note: "salt ל-hash של IP וטוקנים",
  },
  {
    note: "התחברות admin ישירה ל-Worker",
  },
  {
    name: "ALLOWED_ORIGINS",
    scope: "Worker",
    kind: "plain",
    requirement: "recommended",
    note: "CORS ל-login/member APIs",
  },
  {
    name: "NM_CLUB_ADMIN_SERVICE_KEY",
    scope: "Worker",
    kind: "secret",
    requirement: "recommended",
    note: "עדיף אותו ערך כמו ב-Pages admin proxy",
    alternatives: ["ADMIN_SERVICE_KEY"],
  },
  {
    name: "ADMIN_SERVICE_KEY",
    scope: "Worker",
    kind: "secret",
    requirement: "optional",
    note: "alias נתמך בקוד ל-NM_CLUB_ADMIN_SERVICE_KEY",
    alternatives: ["NM_CLUB_ADMIN_SERVICE_KEY"],
  },
];

const workerBindings = [
  {
    name: "CLUB_MEMBERS",
    scope: "Worker binding",
    kind: "kv_namespace",
    requirement: "required",
    note: "אחסון חברים, progress ו-insights",
  },
  {
    name: "CLUB_ACTIVITY",
    scope: "Worker binding",
    kind: "kv_namespace",
    requirement: "required",
    note: "rate limit, recent activity ו-fraud flags",
  },
];

function pickStatus(spec, env) {
  const primary = readEnv(spec.name);
  const alternatives = (spec.alternatives ?? []).map((name) => ({ name, value: readEnv(name) }));
  const alternativeHit = alternatives.find((candidate) => candidate.value);
  const active = primary || alternativeHit?.value || "";
  const activeName = primary ? spec.name : alternativeHit?.name ?? spec.name;
  const isApplicable = typeof spec.when === "function" ? spec.when(env) : true;

  if (!isApplicable) {
    return { status: "skip", detail: "לא נדרש במצב הנוכחי", activeName, activeValue: active };
  }

  if (!active) {
    if (spec.requirement === "required" || spec.requirement === "conditional") {
      return { status: "missing", detail: "חסר", activeName, activeValue: active };
    }
    return { status: "optional-missing", detail: "לא מוגדר", activeName, activeValue: active };
  }

  if (typeof spec.validate === "function") {
    const validationError = spec.validate(active, env);
    if (validationError) {
      return { status: "warn", detail: validationError, activeName, activeValue: active };
    }
  }

  return { status: "ok", detail: primary ? "מוגדר" : `מוגדר דרך ${activeName}`, activeName, activeValue: active };
}

function formatRequirement(spec) {
  if (spec.requirement === "required") return "required";
  if (spec.requirement === "recommended") return "recommended";
  if (spec.requirement === "conditional") return "conditional";
  return "optional";
}

function printSection(title, specs, env) {
  console.log(`\n${title}`);
  console.log("-".repeat(title.length));

  for (const spec of specs.filter((item) => item?.name)) {
    const result = pickStatus(spec, env);
    const marker =
      result.status === "ok"
        ? "OK"
        : result.status === "warn"
          ? "WARN"
          : result.status === "missing"
            ? "MISS"
            : result.status === "skip"
              ? "SKIP"
              : "INFO";

    console.log(
      `${marker.padEnd(4)} ${spec.name} [${spec.kind}; ${formatRequirement(spec)}] - ${result.detail}. ${spec.note}`
    );
  }
}

function collectEnvSnapshot() {
  const combinedSpecs = [...pagesSpecs, ...workerSpecs].filter((spec) => spec?.name);
  const names = new Set(combinedSpecs.map((spec) => spec.name));
  for (const spec of combinedSpecs) {
    for (const alternative of spec.alternatives ?? []) {
      names.add(alternative);
    }
  }

  return Object.fromEntries([...names].map((name) => [name, readEnv(name)]));
}

function printConsistencyChecks(env, packageJson) {
  const issues = [];
  const notes = [];

  const webhook = env.PUBLIC_NM_CLUB_WEBHOOK_URL;
  const base = env.NM_CLUB_AUTH_BASE_URL;
  if (webhook && base) {
    try {
      const webhookUrl = new URL(webhook);
      const baseUrl = new URL(base);
      if (webhookUrl.origin !== baseUrl.origin) {
        issues.push(
          `PUBLIC_NM_CLUB_WEBHOOK_URL מצביע ל-${webhookUrl.origin} אבל NM_CLUB_AUTH_BASE_URL מצביע ל-${baseUrl.origin}.`
        );
      } else if (webhookUrl.pathname !== "/auth/login") {
        notes.push("PUBLIC_NM_CLUB_WEBHOOK_URL לא מצביע ל-/auth/login. זה חוקי, אבל כרגע ה-frontend מצפה ל-login path הזה.");
      }
    } catch {
      issues.push("לא ניתן לנתח PUBLIC_NM_CLUB_WEBHOOK_URL או NM_CLUB_AUTH_BASE_URL כ-URL תקין.");
    }
  }

  const workerServiceKey = env.NM_CLUB_ADMIN_SERVICE_KEY || env.ADMIN_SERVICE_KEY;
  if (env.NM_CLUB_ADMIN_SERVICE_KEY && env.ADMIN_SERVICE_KEY && env.NM_CLUB_ADMIN_SERVICE_KEY !== env.ADMIN_SERVICE_KEY) {
    issues.push("גם NM_CLUB_ADMIN_SERVICE_KEY וגם ADMIN_SERVICE_KEY מוגדרים אבל עם ערכים שונים.");
  }

  if (boolFlag(env.PUBLIC_CLUB_ADMIN_VIA_PROXY || "")) {
    if (!env.NM_CLUB_AUTH_BASE_URL) {
      issues.push("PUBLIC_CLUB_ADMIN_VIA_PROXY פעיל אבל חסר NM_CLUB_AUTH_BASE_URL.");
    }
    if (!env.NM_CLUB_ADMIN_SERVICE_KEY) {
      issues.push("PUBLIC_CLUB_ADMIN_VIA_PROXY פעיל אבל חסר NM_CLUB_ADMIN_SERVICE_KEY בצד Pages.");
    }
    if (!workerServiceKey) {
      notes.push("הסקריפט לא רואה NM_CLUB_ADMIN_SERVICE_KEY/ADMIN_SERVICE_KEY בצד Worker. ודא שהסוד קיים גם ב-Worker.");
    }
  }

  const scripts = packageJson?.scripts ?? {};
  if (typeof scripts["deploy:cloudflare"] === "string" && typeof scripts["deploy:worker"] !== "string") {
    issues.push("קיים deploy:cloudflare ל-Pages אבל חסר deploy:worker. זה מגדיל סיכון ל-drift בין האתר ל-Worker.");
  }
  if (typeof scripts["deploy:all"] !== "string") {
    notes.push("אין deploy:all שמפרסם גם Pages וגם Worker באותו flow.");
  }

  console.log("\nConsistency Checks");
  console.log("------------------");
  if (issues.length === 0 && notes.length === 0) {
    console.log("OK   לא נמצאו פערי עקביות ברורים בסביבה המקומית.");
    return;
  }

  for (const issue of issues) {
    console.log(`MISS ${issue}`);
  }
  for (const note of notes) {
    console.log(`INFO ${note}`);
  }
}

function printBindingSection() {
  console.log("\nWorker Bindings");
  console.log("---------------");
  for (const binding of workerBindings) {
    console.log(`REQ  ${binding.name} [${binding.kind}; required] - ${binding.note}`);
  }
  console.log("INFO Bindings לא נבדקים מתוך process.env. צריך לאמת אותם ב-wrangler.toml וב-Cloudflare dashboard.");
}

async function readPackageJson() {
  const raw = await readFile(PACKAGE_JSON_PATH, "utf8");
  return JSON.parse(raw);
}

async function main() {
  const packageJson = await readPackageJson();
  const env = collectEnvSnapshot();

  console.log("NeverMind Cloudflare Environment Audit");
  console.log("======================================");
  console.log("הדוח בודק את ציפיות הקוד לפי הסביבה המקומית הנוכחית.");
  console.log("הוא לא מושך נתונים ישירות מ-Cloudflare, אלא עוזר לזהות מה חייב להיות מוגדר ב-Pages וב-Worker.");

  printSection("Pages Variables", pagesSpecs, env);
  printSection("Worker Variables", workerSpecs, env);
  printBindingSection();
  printConsistencyChecks(env, packageJson);
}

main().catch((error) => {
  console.error("MISS audit failed:", error instanceof Error ? error.message : String(error));
  process.exit(1);
});
