import { ARTICLE_TAG_WHITELIST, ARTICLE_TAG_WHITELIST_SET } from "../data/article-tags.js";
import { ROBOTIC_BLOCKLIST, SENSITIVE_TOPIC_WARNING, validateAndClassify } from "../utils/contentValidator.js";

const wizardGlobal = globalThis;
const SLUG_EN_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const YOUTUBE_ID_RE = /^[a-zA-Z0-9_-]{11}$/;
const WORD_WARN = 900;
const WORD_DEEP = 1400;
const LONG_SENTENCE_WORDS = 20;

/** מחלץ מזהה סרטון מכל קישור יוטיוב נפוץ או מזהה 11 תווים */
export function extractYoutubeId(raw) {
  const s = String(raw || "").trim();
  if (!s) return "";
  if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s;
  try {
    const u = s.startsWith("http://") || s.startsWith("https://") ? new URL(s) : new URL(`https://${s}`);
    if (u.hostname === "youtu.be") {
      const id = u.pathname.replace(/^\//, "").slice(0, 11);
      return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : "";
    }
    if (u.hostname.includes("youtube.com") || u.hostname.includes("youtube-nocookie.com")) {
      const v = u.searchParams.get("v");
      if (v && /^[a-zA-Z0-9_-]{11}$/.test(v.slice(0, 11))) return v.slice(0, 11);
      const embed = u.pathname.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
      if (embed) return embed[1];
      const shorts = u.pathname.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
      if (shorts) return shorts[1];
    }
  } catch {
    return "";
  }
  return "";
}

function sanitizeTagsFromCsv(raw) {
  const parts = String(raw || "")
    .split(/[,"]/)
    .map((t) => t.trim())
    .filter(Boolean);
  const out = [];
  const seen = new Set();
  for (const t of parts) {
    if (ARTICLE_TAG_WHITELIST_SET.has(t) && !seen.has(t)) {
      seen.add(t);
      out.push(t);
    }
  }
  return out.join(", ");
}

function normalizeMdxWhitespace(text) {
  return String(text || "")
    .replace(/\u2013|\u2014/g, "-")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function countLongSentences(body) {
  const t = String(body || "").trim();
  if (!t) return 0;
  const sentences = t.split(/[.!?\n]+/).map((x) => x.trim()).filter(Boolean);
  let n = 0;
  for (const sent of sentences) {
    const wc = sent.split(/\s+/).filter(Boolean).length;
    if (wc > LONG_SENTENCE_WORDS) n += 1;
  }
  return n;
}
const REQUIRED_FRONTMATTER_KEYS = [
  "title",
  "description",
  "pubDate",
  "author",
  "questionForSchema",
  "originalInsight",
  "difficultyLevel",
  "mindShiftIntensity",
  "imageAlt",
  "slug",
  "tags",
  "image",
  "isPremium",
];

function countWords(raw) {
  return String(raw || "")
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
}

function runBlockingChecks(data) {
  const errors = [];
  const tagsClean = sanitizeTagsFromCsv(data.tags);
  const slug = data.slug.trim();
  const boot = typeof window !== "undefined" && window.__NM_WIZARD_BOOT ? window.__NM_WIZARD_BOOT : {};
  const taken = Array.isArray(boot.existingSlugs) ? boot.existingSlugs : [];

  if (!slug) {
    errors.push("חסרה כתובת באנגלית קטנה (slug).");
  } else if (!SLUG_EN_RE.test(slug)) {
    errors.push("הכתובת באנגלית קטנה, מקפים בלבד, בלי רווחים.");
  } else if (taken.includes(slug)) {
    errors.push("הכתובת באנגלית כבר קיימת במערכת. בחר שם אחר.");
  }

  const tagParts = tagsClean
    .split(/[,"]/)
    .map((tag) => tag.trim())
    .filter(Boolean);

  if (!tagParts.length) {
    errors.push("חסרות תגיות מהרשימה המאושרת. בחר לפחות תגית אחת.");
  }

  if (!data.questionForSchema.trim()) errors.push("חסרה שאלה למנועי חיפוש (שלב 1).");
  if (!data.aha.trim()) errors.push("חסרה תובנת ליבה (שלב 1).");
  if (!data.imageAlt.trim()) errors.push("חסר תיאור תמונה (שלב 1).");

  return errors;
}

function runPreflight(data) {
  const warnings = [];
  const youtubeId = data.youtubeId.trim();
  if (youtubeId && !YOUTUBE_ID_RE.test(youtubeId)) {
    warnings.push("מזהה YouTube לא תקין (צפוי בדיוק 11 תווים).");
  }

  const summary = data.summary.trim();
  if (summary.length > 0 && (summary.length < 150 || summary.length > 160)) {
    warnings.push(`אורך התקציר לחיפוש: בין 150 ל־160 תווים. כעת: ${summary.length}.`);
  }

  const wordCount = countWords(data.body);
  if (wordCount > 0 && wordCount < 120) {
    warnings.push(`מעט מילים בטיוטה (${wordCount}). אם זה מכוון, בסדר.`);
  }
  const bodyLines = data.body.split("\n");
  const hashes = bodyLines.filter((line) => /^#{1,6}\s/.test(line.trim()));
  let lastLevel = 0;
  let skip = false;
  for (const h of hashes) {
    const m = h.match(/^(#{1,6})\s/);
    const lvl = m ? m[1].length : 0;
    if (lvl > 0 && lastLevel > 0 && lvl > lastLevel + 1) {
      skip = true;
      break;
    }
    if (lvl > 0) lastLevel = lvl;
  }
  if (skip) {
    warnings.push("בטיוטה יש דילוג ברמת כותרות (למשל מ־## ל־####). עדיף רצף H2→H3.");
  }
  if (wordCount >= WORD_DEEP) {
    warnings.push(`הטיוטה ארוכה (${wordCount} מילים). מתאים בדרך כלל לרמת עומק גבוהה.`);
  } else if (wordCount >= WORD_WARN) {
    warnings.push(`הטיוטה מעל ${WORD_WARN} מילים. שקול רמת עומק מתקדמים או עומק.`);
  }

  return warnings;
}

function fieldValue(id) {
  const element = document.getElementById(id);
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    return element.value;
  }
  return "";
}

function fieldTrim(id) {
  return fieldValue(id).trim();
}

function yq(s) {
  return String(s ?? "").replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function pickClaimForInversion(text) {
  const cleaned = String(text || "")
    .replace(/^---[\s\S]*?---/m, "")
    .replace(/[#*_`>-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const candidates = cleaned
    .split(/[.!?]\s+/)
    .map((line) => line.trim())
    .filter((line) => line.length >= 20);
  return candidates[0] || "";
}

function parseFrontmatter(raw) {
  const match = String(raw || "").match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) return { frontmatter: "", body: String(raw || "") };
  return {
    frontmatter: match[1],
    body: String(raw || "").slice(match[0].length),
  };
}

function readSimpleYamlValue(frontmatter, key) {
  const lineMatch = frontmatter.match(new RegExp(`^${key}:\\s*(.+)$`, "m"));
  if (!lineMatch) return "";
  const raw = lineMatch[1].trim();
  if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
    return raw.slice(1, -1).trim();
  }
  return raw;
}

function parseYamlTags(frontmatter) {
  const raw = readSimpleYamlValue(frontmatter, "tags");
  if (!raw) return [];
  if (raw.startsWith("[") && raw.endsWith("]")) {
    return raw
      .slice(1, -1)
      .split(",")
      .map((item) => item.trim().replace(/^["']|["']$/g, ""))
      .filter(Boolean);
  }
  return [];
}

function validateExternalMdx(raw) {
  const errors = [];
  const warnings = [];
  const parsed = parseFrontmatter(raw);

  if (!parsed.frontmatter.trim()) {
    errors.push("חסר frontmatter בתחילת הקובץ.");
    return { errors, warnings, slug: "", body: "" };
  }

  for (const key of REQUIRED_FRONTMATTER_KEYS) {
    const value = key === "tags" ? parseYamlTags(parsed.frontmatter) : readSimpleYamlValue(parsed.frontmatter, key);
    const missing = Array.isArray(value) ? value.length === 0 : !String(value || "").trim();
    if (missing) errors.push(`חסר שדה חובה: ${key}`);
  }

  const slug = readSimpleYamlValue(parsed.frontmatter, "slug").trim();
  if (slug && !SLUG_EN_RE.test(slug)) {
    errors.push("slug לא תקין. נדרש אנגלית קטנה + מקפים.");
  }

  const tags = parseYamlTags(parsed.frontmatter);
  for (const tag of tags) {
    if (!ARTICLE_TAG_WHITELIST_SET.has(tag)) {
      errors.push(`תגית לא ברשימה: "${tag}"`);
    }
  }

  if (/\bשלב\b/.test(parsed.body)) {
    warnings.push('נמצאה המילה "שלב" בגוף המאמר. להחליף במספור או בנקודות.');
  }

  const bodyLines = parsed.body.split("\n").map((line) => line.trim()).filter(Boolean);
  const questionLine = [...bodyLines].reverse().find((line) => line.includes("?"));
  if (!questionLine) {
    errors.push("חסרה שאלה פתוחה בסוף.");
  } else {
    const realityQuestionRe = /(אצלך|בחיים שלך|ביום שלך|במציאות שלך|אתה|שלך)/;
    if (!realityQuestionRe.test(questionLine)) {
      errors.push("השאלה בסוף חייבת להתייחס למציאות של הקורא.");
    }
  }

  return { errors, warnings, slug, body: parsed.body };
}

/** טיוטת MDX להורדה מקומית - בלי מודל חיצוני */
function buildMdxStub(data) {
  const today = new Date().toISOString().slice(0, 10);
  const slug = data.slug.trim() || "draft-article";
  const tagParts = data.tags
    .split(/[,"]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
  const tagsYaml = tagParts.map((t) => `"${yq(t)}"`).join(", ");
  const body = data.body.trim() || "<!-- גוף המאמר -->\n";

  return `---
title: "${yq(data.topic || "כותרת זמנית")}"
description: "${yq(data.summary || "תקציר לחיפוש")}"
pubDate: ${today}
author: "השם לא משנה"
questionForSchema: "${yq(data.questionForSchema)}"
originalInsight: "${yq(data.aha)}"
difficultyLevel: ${data.difficultyLevel || "beginner"}
mindShiftIntensity: ${Number(data.mindShiftIntensity) || 3}
imageAlt: "${yq(data.imageAlt)}"
slug: "${yq(slug)}"
tags: [${tagsYaml}]
image: "/assets/images/articles/${slug}.webp"
isPremium: ${Boolean(data.isPremium)}${data.youtubeId ? `\nyoutubeId: "${yq(data.youtubeId)}"` : ""}
draft: true
---

${body}
`;
}

function isWizardFieldTarget(target) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const element = target.closest(
    "#wiz-topic, #wiz-aha, #wiz-question-schema, #wiz-image-alt, #wiz-bottom-line, #wiz-inversion, #wiz-slug, #wiz-summary, #wiz-points, #wiz-tags, #wiz-youtube, #wiz-body, #wiz-output, #wiz-external-mdx, #wiz-claim-inversion"
  );
  return Boolean(element);
}

function setupArticleWizard() {
  const root = document.getElementById("nm-article-wizard");
  if (!(root instanceof HTMLElement)) {
    return;
  }

  if (typeof wizardGlobal.__nmWizardCleanup === "function") {
    wizardGlobal.__nmWizardCleanup();
  }

  const abortController = new AbortController();
  const { signal } = abortController;
  let restoreTimer;
  let mutationObserver = null;

  wizardGlobal.__nmWizardCleanup = () => {
    abortController.abort();
    mutationObserver?.disconnect();
    if (restoreTimer) {
      window.clearTimeout(restoreTimer);
    }
    wizardGlobal.__nmWizardCleanup = undefined;
  };

  const steps = Array.from(root.querySelectorAll(".wizard-step"));
  let current = 1;
  let draftRestored = false;
  let externalValidated = false;
  let selectedClaim = "";
  let focusMode = false;

  const progress = document.getElementById("wizard-progress");
  const stepLabel = document.getElementById("wizard-step-label");
  const wordCountEl = document.getElementById("wiz-word-count");
  const preflightEl = document.getElementById("wiz-preflight");
  const blockersEl = document.getElementById("wiz-blockers");

  const collectData = () => {
    const audience = document.getElementById("wiz-audience");
    const isPremium = document.getElementById("wiz-is-premium");
    const difficulty = document.getElementById("wiz-difficulty");
    const mindShift = document.getElementById("wiz-mind-shift");
    const tone = document.getElementById("wiz-tone");
    const length = document.getElementById("wiz-length");
    const tagsRaw = fieldTrim("wiz-tags");
    const tags = sanitizeTagsFromCsv(tagsRaw);
    const ytRaw = fieldTrim("wiz-youtube");
    const youtubeParsed = extractYoutubeId(ytRaw) || (YOUTUBE_ID_RE.test(ytRaw.trim()) ? ytRaw.trim() : "");

    return {
      topic: fieldTrim("wiz-topic"),
      audience: audience instanceof HTMLSelectElement ? audience.value : "",
      aha: fieldTrim("wiz-aha"),
      bottomLine: fieldTrim("wiz-bottom-line"),
      inversionNote: fieldTrim("wiz-inversion"),
      isPremium: isPremium instanceof HTMLInputElement ? isPremium.checked : false,
      difficultyLevel: difficulty instanceof HTMLSelectElement ? difficulty.value : "beginner",
      slug: fieldTrim("wiz-slug"),
      questionForSchema: fieldTrim("wiz-question-schema"),
      imageAlt: fieldTrim("wiz-image-alt"),
      mindShiftIntensity: mindShift instanceof HTMLSelectElement ? mindShift.value : "3",
      summary: fieldTrim("wiz-summary"),
      tone: tone instanceof HTMLSelectElement ? tone.value : "",
      points: fieldValue("wiz-points"),
      length: length instanceof HTMLSelectElement ? length.value : "",
      tags,
      youtubeId: youtubeParsed,
      body: fieldValue("wiz-body"),
    };
  };

  const syncTagsHiddenInput = (csv) => {
    const el = document.getElementById("wiz-tags");
    if (el instanceof HTMLInputElement) el.value = csv;
  };

  const step1HasBlockers = (data) => {
    if (!data.slug.trim() || !data.questionForSchema.trim() || !data.aha.trim() || !data.imageAlt.trim()) return true;
    return false;
  };

  const updateTabDots = () => {
    const data = collectData();
    const dot = root.querySelector("[data-wiz-tab-dot=\"1\"]");
    if (dot instanceof HTMLElement) {
      dot.classList.toggle("hidden", !step1HasBlockers(data));
    }
  };

  let paintTagChips = () => {};

  const initTagChips = () => {
    const container = document.getElementById("wiz-tag-chips");
    if (!container) {
      return;
    }
    const whitelist = window.__NM_WIZARD_BOOT?.tagWhitelist || ARTICLE_TAG_WHITELIST;

    paintTagChips = () => {
      const selected = new Set(
        sanitizeTagsFromCsv(fieldTrim("wiz-tags"))
          .split(/[,"]/)
          .map((t) => t.trim())
          .filter(Boolean),
      );
      container.innerHTML = "";
      for (const tag of whitelist) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.dataset.tag = tag;
        btn.textContent = tag;
        btn.className = `nm-wiz-chip${selected.has(tag) ? " nm-wiz-chip--on" : ""}`;
        container.appendChild(btn);
      }
    };

    container.addEventListener(
      "click",
      (e) => {
        const btn = e.target.closest("button[data-tag]");
        if (!(btn instanceof HTMLButtonElement) || !container.contains(btn)) {
          return;
        }
        const tag = btn.dataset.tag || "";
        const selected = new Set(
          sanitizeTagsFromCsv(fieldTrim("wiz-tags"))
            .split(/[,"]/)
            .map((t) => t.trim())
            .filter(Boolean),
        );
        if (selected.has(tag)) {
          selected.delete(tag);
        } else {
          selected.add(tag);
        }
        syncTagsHiddenInput([...selected].join(", "));
        paintTagChips();
        onWizardFieldActivity();
      },
      { signal },
    );

    paintTagChips();
  };

  const fillLatestInternalList = () => {
    const ul = document.getElementById("wiz-latest-internal-list");
    const boot = typeof window !== "undefined" && window.__NM_WIZARD_BOOT ? window.__NM_WIZARD_BOOT : {};
    const items = Array.isArray(boot.latestArticlesForWizard) ? boot.latestArticlesForWizard : [];
    if (!ul) {
      return;
    }
    ul.innerHTML = "";
    for (const item of items) {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = item.href || "#";
      a.textContent = item.title || item.href || "";
      a.className = "text-[var(--nm-accent)] underline underline-offset-2";
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      li.appendChild(a);
      ul.appendChild(li);
    }
  };

  const updateWordCountAndPreflight = () => {
    const data = collectData();
    const wordCount = countWords(data.body);

    if (wordCountEl instanceof HTMLElement) {
      wordCountEl.textContent = `מילים בטיוטה: ${wordCount}`;
    }

    const sentenceWarn = document.getElementById("wiz-sentence-warn");
    if (sentenceWarn instanceof HTMLElement) {
      const n = countLongSentences(data.body);
      if (n > 0) {
        sentenceWarn.classList.remove("hidden");
        sentenceWarn.textContent = `נמצאו ${n} משפטים ארוכים (מעל ${LONG_SENTENCE_WORDS} מילים). שקול לפצל.`;
      } else {
        sentenceWarn.classList.add("hidden");
        sentenceWarn.textContent = "";
      }
    }

    updateTabDots();

    if (current !== 2) {
      return;
    }

    const blockers = runBlockingChecks(data);
    if (blockersEl instanceof HTMLElement) {
      if (blockers.length > 0) {
        blockersEl.classList.remove("hidden");
        blockersEl.textContent = ["לא עוברים לשלב 3 עד שמתקנים:", ...blockers.map((item) => `• ${item}`)].join("\n");
      } else {
        blockersEl.classList.add("hidden");
        blockersEl.textContent = "";
      }
    }

    if (preflightEl instanceof HTMLElement) {
      const warnings = runPreflight(data);
      const scanBlob = [
        data.body,
        data.summary,
        data.bottomLine,
        data.topic,
        data.aha,
        data.questionForSchema,
        data.imageAlt,
      ].join("\n");
      const classification = validateAndClassify(scanBlob);
      if (classification.recommendPremium) {
        warnings.push(`${SENSITIVE_TOPIC_WARNING} · זוהו: ${classification.matchedSensitive.join(", ")}`);
      }
      preflightEl.textContent =
        warnings.length > 0
          ? ["אזהרות:", ...warnings.map((item) => `• ${item}`)].join("\n")
          : "אין אזהרות. אם אין חסימות באדום, אפשר להתקדם.";
    }
  };

  const render = () => {
    steps.forEach((step, index) => step.classList.toggle("hidden", index + 1 !== current));

    if (progress instanceof HTMLElement) {
      progress.style.width = `${(current / 3) * 100}%`;
    }
    if (stepLabel instanceof HTMLElement) {
      stepLabel.textContent = `צעד ${current} מתוך 3`;
    }

    root.querySelectorAll("[data-wiz-tab]").forEach((el) => {
      const n = Number(el.getAttribute("data-wiz-tab"));
      const isActive = n === current;
      el.classList.toggle("nm-wizard-tab-active", isActive);
      el.setAttribute("aria-current", isActive ? "step" : "false");
    });

    const backBtn = document.getElementById("wiz-back");
    const nextBtn = document.getElementById("wiz-next");
    if (backBtn instanceof HTMLButtonElement) {
      backBtn.disabled = current === 1;
    }
    if (nextBtn instanceof HTMLButtonElement) {
      nextBtn.classList.toggle("hidden", current === 3);
    }
    if (current === 2) {
      updateWordCountAndPreflight();
    } else {
      updateTabDots();
    }
  };

  const goToStep = (step) => {
    current = Math.min(3, Math.max(1, step));
    render();
  };

  const canonicalTagsCsv = ARTICLE_TAG_WHITELIST.join(", ");
  const depthBlock = `[Depth layers for NeverMind]
- Level 1 (beginner): plain language, clarity at a level a smart reader can follow without jargon.
- Level 2 (advanced): eye-level, precise, professional but still clean.
- Level 3 (deep / club): radical doubt, ontological inquiry, and the Inversion Method (flip default assumptions).`;

  const buildPrompt = () => {
    const data = collectData();
    const normalizedPoints = data.points
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .join(", ");
    const inversionNote = data.inversionNote ? ` Inversion / depth notes: ${data.inversionNote}.` : "";
    const bottomLine = data.bottomLine ? ` Bottom line for the reader: ${data.bottomLine}.` : "";
    const defaultImagePath = data.slug ? `/assets/images/articles/${data.slug}.webp` : "/assets/images/articles/[slug].webp";
    const roboticBannedList = ROBOTIC_BLOCKLIST.join(", ");

    return `[Role: Strategic Content Expert]
[Context: NeverMind Project]
Act as a high-end content strategist for NeverMind. Write an article about ${data.topic || "[Topic]"} for ${data.audience || "[Audience]"}. The core insight is ${data.aha || "[originalInsight]"}.${bottomLine}${inversionNote}

[Content policy - Hebrew instruction for the model]
חוקי תוכן: היה מודע לכך שנושאים כמו סמים, מין, פורנו, הימורים והתמכרויות (וביטויים קרובים באנגלית כגון drugs, porn, gambling, addiction) גורמים לזיהוי פרימיום בזרימת האתר. אם הנושא נוגע לכך, הגדר isPremium: true. השתמש בשפה ישירה אך אחראית. בלי סנסציה. בלי הנחיות מפרות חוק.

You MUST output a single MDX file with YAML frontmatter.

Mandatory frontmatter - always generate these keys with real, non-empty values (never placeholder text, never skip):
- questionForSchema
- originalInsight
- difficultyLevel (beginner | advanced | deep)
- mindShiftIntensity (integer 1-5)
- imageAlt

Forbidden robotic / corporate cliche vocabulary - do NOT use these strings anywhere in the entire output (including YAML values, title, description, and body). Case-insensitive; includes multi-word phrases:
${roboticBannedList}

Wizard inputs vs final file: Values typed in the wizard (topic, bullets, draft body inside [DRAFT_BODY_START]...[DRAFT_BODY_END]) may include rough notes or placeholder phrasing. The final MDX you produce must rewrite this into clean NeverMind voice and MUST obey every rule above. Do not paste robotic or filler phrasing from the draft into the published text.

Required frontmatter keys (all must be present with non-empty values where noted):
- title: Hebrew title
- description: meta description ~150-160 chars
- pubDate: YYYY-MM-DD
- author: default "השם לא משנה"
- questionForSchema: distilled search-facing question (Hebrew) - ${data.questionForSchema || "[fill]"}
- originalInsight: same core as the article spine - ${data.aha || "[fill]"}
- difficultyLevel: one of beginner | advanced | deep - use ${data.difficultyLevel}
- mindShiftIntensity: integer 1-5 - use ${data.mindShiftIntensity}
- imageAlt: Hebrew. Describe the CONCEPT the hero image stands for, not only pixels. Pattern: [brief visible scene] - [semantic role for the article]. Example shape: "אדם עומד מול מראה שבורה - ייצוג ויזואלי לפירוק האגו". Search engines use this for topical/philosophical context; keep concrete + interpretive in one line. Wizard draft: ${data.imageAlt || "[fill]"}
- slug: REQUIRED, English only, kebab-case, aligned with title - ${data.slug || "[Slug]"}
- tags: array; ONLY these exact Hebrew strings (comma-separated canonical list): ${canonicalTagsCsv}
- image: default hero path ${defaultImagePath} unless a different asset is explicitly intended
- isPremium: ${data.isPremium}
- youtubeId, bottomLine, inversionNote, reflectionQuestions, faq: as in project conventions

Tags rule: never invent a tag outside the canonical list. Slug rule: [a-z0-9-] only.
imageAlt rule: must fuse literal scene with symbolic meaning tied to the article thesis; avoid generic stock phrases ("תמונה של אדם").

Style: ${data.tone || "[Tone]"}. Ensure the piece includes: ${normalizedPoints || "[Key Points]"}. Length intent: ${data.length || "[Length]"}. Draft body (if any) should be refined, not duplicated blindly:
[DRAFT_BODY_START]
${data.body.trim() || "[no draft yet]"}
[DRAFT_BODY_END]
${depthBlock}
Follow the brand identity: zero fluff, focus on thought-shifts, NeverMind voice (direct, analytical, no filler).
[Output Instructions: Markdown; no fluff; focus on Thought-Shifts; structure for web reading.
- Use the following heading order and exact labels (must match exactly):
  1) ## מה המנגנון כאן
  2) ## שאלת היפוך
  3) ### ניסוי קצר
  4) ## סיכום פרקטי
- Never use the Hebrew word "שלב" inside the article body.
- End with exactly one open question about the reader's own reality (not about the article).
- Inside at least 2 headings above, weave 2-3 natural SEO phrases derived from the topic (use Hebrew patterns like: איך {topic}, איך להפסיק {topic}, פתרון ... בזוגיות when relevant).
- Two-layer writing: each paragraph has two sentences. First sentence simple and concrete. Second sentence deeper and more precise.
- Keep paragraphs short. No generic filler.
]`;
  };

  const buildQuickPackage = () => {
    const prompt = buildPrompt();
    return `${prompt}

[Delivery rule for external model]
קח את הפרומפט הזה ותייצר פלט MDX מלא. אל תסיר שדות חובה. אל תכניס ניסוח רובוטי. החזר רק קובץ אחד להדבקה.`;
  };

  const onCopyPackage = async () => {
    const saveStatus = document.getElementById("wiz-save-status");
    try {
      await navigator.clipboard.writeText(buildQuickPackage());
      if (saveStatus instanceof HTMLElement) {
        saveStatus.textContent = "חבילת יצירה מהירה הועתקה. אפשר להדביק במודל חיצוני.";
      }
    } catch {
      if (saveStatus instanceof HTMLElement) {
        saveStatus.textContent = "לא ניתן להעתיק כרגע. אפשר להעתיק ידנית מהשדה.";
      }
    }
  };

  const onValidateExternal = () => {
    const external = fieldValue("wiz-external-mdx");
    const result = document.getElementById("wiz-external-result");
    const saveStatus = document.getElementById("wiz-save-status");
    if (!(result instanceof HTMLElement)) return;

    const check = validateExternalMdx(external);
    externalValidated = check.errors.length === 0;
    if (check.errors.length > 0) {
      result.classList.remove("hidden");
      result.textContent = ["חסימות:", ...check.errors.map((item) => `• ${item}`)].join("\n");
      if (saveStatus instanceof HTMLElement) saveStatus.textContent = "יש חסימות לפני הורדה.";
      return;
    }

    const warnings = check.warnings.length > 0 ? ["אזהרות:", ...check.warnings.map((item) => `• ${item}`)] : ["אין אזהרות."];
    result.classList.remove("hidden");
    result.textContent = warnings.join("\n");
    if (saveStatus instanceof HTMLElement) saveStatus.textContent = "הקובץ עבר בדיקה בסיסית.";

    const openGithub = document.getElementById("wiz-open-github");
    if (openGithub instanceof HTMLAnchorElement && check.slug) {
      const fileName = `${check.slug}.mdx`;
      const current = new URL(openGithub.href);
      current.searchParams.set("filename", fileName);
      openGithub.href = current.toString();
    }
  };

  const onInvertClaim = () => {
    const wrap = document.getElementById("wiz-inversion-wrap");
    const source = document.getElementById("wiz-claim-source");
    if (!(wrap instanceof HTMLElement) || !(source instanceof HTMLElement)) return;
    const external = fieldValue("wiz-external-mdx");
    selectedClaim = pickClaimForInversion(external);
    if (!selectedClaim) {
      wrap.classList.add("hidden");
      return;
    }
    source.textContent = `טענה לבדיקה: ${selectedClaim}`;
    wrap.classList.remove("hidden");
  };

  const goBack = () => {
    current = Math.max(1, current - 1);
    render();
  };

  const toggleFocusMode = () => {
    focusMode = !focusMode;
    root.classList.toggle("nm-wizard--focus", focusMode);
    const btn = document.getElementById("wiz-focus-toggle");
    if (btn instanceof HTMLButtonElement) {
      btn.textContent = focusMode ? "יציאה ממצב מיקוד" : "מצב מיקוד";
    }
  };

  const onMobilePreview = () => {
    const dialog = document.getElementById("wiz-mobile-dialog");
    const body = document.getElementById("wiz-mobile-preview-body");
    const out = document.getElementById("wiz-output");
    if (!(dialog instanceof HTMLDialogElement) || !(body instanceof HTMLElement)) {
      return;
    }
    const text = out instanceof HTMLTextAreaElement ? out.value.trim() : "";
    body.textContent = text || "(ריק - לחץ קודם על לזקק למאמר)";
    dialog.showModal();
  };

  const goNext = () => {
    if (current === 2) {
      updateWordCountAndPreflight();
      const blockers = runBlockingChecks(collectData());
      if (blockers.length > 0) {
        return;
      }
    }
    current = Math.min(3, current + 1);
    render();
  };

  const onGenerate = () => {
    const output = document.getElementById("wiz-output");
    if (!(output instanceof HTMLTextAreaElement)) {
      return;
    }
    output.value = buildPrompt();
  };

  const onCopyAllMdx = async () => {
    const copyBtn = document.getElementById("wiz-copy-all-mdx");
    const saveStatus = document.getElementById("wiz-save-status");
    const data = collectData();
    const blockers = runBlockingChecks(data);
    if (blockers.length > 0) {
      if (saveStatus instanceof HTMLElement) {
        saveStatus.textContent = ["לא ניתן להעתיק לפני תיקון:", ...blockers.map((item) => `• ${item}`)].join("\n");
      }
      return;
    }
    const raw = buildMdxStub(data);
    const text = normalizeMdxWhitespace(raw);
    try {
      await navigator.clipboard.writeText(text);
      if (copyBtn instanceof HTMLButtonElement) {
        const originalText = copyBtn.textContent || "העתק את כל קוד ה-MDX";
        copyBtn.textContent = "הועתק";
        window.setTimeout(() => {
          copyBtn.textContent = originalText;
        }, 2000);
      }
      if (saveStatus instanceof HTMLElement) {
        saveStatus.textContent = "קוד MDX מלא הועתק ללוח.";
      }
    } catch {
      if (saveStatus instanceof HTMLElement) {
        saveStatus.textContent = "לא ניתן להעתיק כרגע.";
      }
    }
  };

  const storageKey = "nm-article-wizard-draft";
  const setFieldValue = (id, value) => {
    const element = document.getElementById(id);
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      element.value = value;
    }
  };

  const restoreDraft = () => {
    const audience = document.getElementById("wiz-audience");
    const isPremium = document.getElementById("wiz-is-premium");
    const difficulty = document.getElementById("wiz-difficulty");
    const mindShift = document.getElementById("wiz-mind-shift");
    const tone = document.getElementById("wiz-tone");
    const length = document.getElementById("wiz-length");

    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) {
        return;
      }

      const data = JSON.parse(raw) || {};
      setFieldValue("wiz-topic", String(data.topic ?? ""));
      if (audience instanceof HTMLSelectElement) audience.value = String(data.audience ?? "Beginners");
      setFieldValue("wiz-aha", String(data.aha ?? ""));
      setFieldValue("wiz-bottom-line", String(data.bottomLine ?? ""));
      setFieldValue("wiz-inversion", String(data.inversionNote ?? ""));
      if (isPremium instanceof HTMLInputElement) isPremium.checked = Boolean(data.isPremium);
      if (difficulty instanceof HTMLSelectElement) {
        const difficultyLevel = String(data.difficultyLevel ?? "beginner");
        difficulty.value = ["beginner", "advanced", "deep"].includes(difficultyLevel) ? difficultyLevel : "beginner";
      }
      setFieldValue("wiz-slug", String(data.slug ?? ""));
      setFieldValue("wiz-question-schema", String(data.questionForSchema ?? ""));
      setFieldValue("wiz-image-alt", String(data.imageAlt ?? ""));
      if (mindShift instanceof HTMLSelectElement) {
        const intensity = String(data.mindShiftIntensity ?? "3");
        mindShift.value = ["1", "2", "3", "4", "5"].includes(intensity) ? intensity : "3";
      }
      setFieldValue("wiz-summary", String(data.summary ?? ""));
      if (tone instanceof HTMLSelectElement) tone.value = String(data.tone ?? "Provocative");
      setFieldValue("wiz-points", String(data.points ?? ""));
      if (length instanceof HTMLSelectElement) length.value = String(data.length ?? "Short Post");
      setFieldValue("wiz-tags", String(data.tags ?? ""));
      setFieldValue("wiz-youtube", String(data.youtubeId ?? ""));
      setFieldValue("wiz-body", String(data.body ?? ""));
    } catch {
      /* ignore */
    }
  };

  const persistDraft = () => {
    localStorage.setItem(storageKey, JSON.stringify(collectData()));
  };

  const onWizardFieldActivity = () => {
    persistDraft();
    updateWordCountAndPreflight();
  };

  const tryRestoreOnce = () => {
    if (draftRestored) {
      return;
    }
    if (!document.getElementById("wiz-topic")) {
      return;
    }

    draftRestored = true;
    restoreDraft();
    paintTagChips();
    render();
    updateWordCountAndPreflight();
  };

  initTagChips();
  fillLatestInternalList();

  const ytEl = document.getElementById("wiz-youtube");
  if (ytEl instanceof HTMLInputElement) {
    const syncYt = () => {
      const id = extractYoutubeId(ytEl.value);
      if (id) {
        ytEl.value = id;
      }
    };
    ytEl.addEventListener("blur", syncYt, { signal });
  }

  document.addEventListener(
    "paste",
    (e) => {
      const t = e.target;
      if (!(t instanceof HTMLTextAreaElement) && !(t instanceof HTMLInputElement)) {
        return;
      }
      if (!root.contains(t)) {
        return;
      }
      if (t.id === "wiz-output" || t.id === "wiz-tags" || !t.id.startsWith("wiz-")) {
        return;
      }
      e.preventDefault();
      const text = e.clipboardData?.getData("text/plain") ?? "";
      const start = t.selectionStart ?? 0;
      const end = t.selectionEnd ?? 0;
      const v = t.value;
      t.value = `${v.slice(0, start)}${text}${v.slice(end)}`;
      const pos = start + text.length;
      t.selectionStart = t.selectionEnd = pos;
      t.dispatchEvent(new Event("input", { bubbles: true }));
    },
    { signal },
  );

  mutationObserver = new MutationObserver(() => {
    tryRestoreOnce();
  });
  mutationObserver.observe(root, { childList: true, subtree: true });

  tryRestoreOnce();
  restoreTimer = window.setTimeout(() => {
    tryRestoreOnce();
    mutationObserver?.disconnect();
  }, 10000);

  document.addEventListener(
    "click",
    (event) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const closeMobile = target.closest("[data-wiz-close-mobile]");
      if (closeMobile) {
        const dialog = document.getElementById("wiz-mobile-dialog");
        if (dialog instanceof HTMLDialogElement) {
          dialog.close();
        }
        return;
      }

      const tabBtn = target.closest("[data-wiz-tab]");
      if (tabBtn && root.contains(tabBtn)) {
        const n = Number(tabBtn.getAttribute("data-wiz-tab"));
        if (n >= 1 && n <= 3) {
          event.preventDefault();
          goToStep(n);
        }
        return;
      }

      const button = target.closest(
        "#wiz-next, #wiz-back, #wiz-generate, #wiz-copy-all-mdx, #wiz-save, #wiz-download-mdx, #wiz-copy-package, #wiz-validate-external, #wiz-invert-claim, #wiz-focus-toggle, #wiz-mobile-preview",
      );
      if (!button || !root.contains(button)) {
        return;
      }

      event.preventDefault();
      if (button.id === "wiz-back") goBack();
      else if (button.id === "wiz-next") goNext();
      else if (button.id === "wiz-generate") onGenerate();
      else if (button.id === "wiz-copy-all-mdx") void onCopyAllMdx();
      else if (button.id === "wiz-save") void onSave();
      else if (button.id === "wiz-copy-package") void onCopyPackage();
      else if (button.id === "wiz-validate-external") onValidateExternal();
      else if (button.id === "wiz-invert-claim") onInvertClaim();
      else if (button.id === "wiz-download-mdx") onDownloadMdx();
      else if (button.id === "wiz-focus-toggle") toggleFocusMode();
      else if (button.id === "wiz-mobile-preview") onMobilePreview();
    },
    { signal }
  );

  function onDownloadMdx() {
    const saveStatus = document.getElementById("wiz-save-status");
    const data = collectData();
    persistDraft();
    const external = fieldValue("wiz-external-mdx").trim();
    const inversion = fieldTrim("wiz-claim-inversion");
    if (!external) {
      const blockers = runBlockingChecks(data);
      if (blockers.length > 0) {
        if (saveStatus instanceof HTMLElement) {
          saveStatus.textContent = "לא ניתן להוריד לפני תיקון החסימות.";
        }
        return;
      }
    }

    if (external) {
      if (!externalValidated) {
        if (saveStatus instanceof HTMLElement) saveStatus.textContent = "יש להריץ בדיקה על פלט חיצוני לפני הורדה.";
        return;
      }
      if (!selectedClaim) {
        if (saveStatus instanceof HTMLElement) saveStatus.textContent = 'לחץ "הפוך טענה" לפני הורדה.';
        return;
      }
      if (!inversion) {
        if (saveStatus instanceof HTMLElement) saveStatus.textContent = "נדרש למלא היפוך לטענה לפני הורדה.";
        return;
      }
    }

    const stubRaw = buildMdxStub(data);
    const raw = external || normalizeMdxWhitespace(stubRaw);
    const externalCheck = external ? validateExternalMdx(external) : null;
    const slug = externalCheck?.slug || data.slug.trim() || "draft-article";
    const blob = new Blob([raw], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slug}.mdx`;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);

    if (saveStatus instanceof HTMLElement) {
      saveStatus.textContent = "קובץ MDX הורד. להעביר ל־src/content/articles/ ולהדביק ב-GitHub.";
    }
  }

  async function onSave() {
    const saveStatus = document.getElementById("wiz-save-status");
    const payload = collectData();
    persistDraft();

    let savedViaHook = false;
    const hook = window.__nmGeneratorSave;
    if (typeof hook === "function") {
      try {
        await hook(payload);
        savedViaHook = true;
      } catch {
        savedViaHook = false;
      }
    }

    if (saveStatus instanceof HTMLElement) {
      saveStatus.textContent = savedViaHook ? "נשמר דרך חיבור חיצוני." : "נשמר בדפדפן בלבד.";
    }
  }

  document.addEventListener(
    "input",
    (event) => {
      if (!(event.target instanceof Node) || !root.contains(event.target)) {
        return;
      }
      if (!isWizardFieldTarget(event.target)) {
        return;
      }
      onWizardFieldActivity();
    },
    { signal }
  );

  document.addEventListener(
    "change",
    (event) => {
      if (!(event.target instanceof Node) || !root.contains(event.target)) {
        return;
      }

      const target = event.target;
      if (target instanceof HTMLElement && typeof target.id === "string" && target.id.startsWith("wiz-")) {
        onWizardFieldActivity();
      }
    },
    { signal }
  );

  render();
}

if (!wizardGlobal.__nmWizardLoadBound) {
  wizardGlobal.__nmWizardLoadBound = true;
  document.addEventListener("astro:page-load", () => {
    setupArticleWizard();
  });
}

window.requestAnimationFrame(() => {
  setupArticleWizard();
});


