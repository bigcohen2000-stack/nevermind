import { ARTICLE_TAG_WHITELIST, ARTICLE_TAG_WHITELIST_SET } from "../data/article-tags.js";
import { ROBOTIC_BLOCKLIST, SENSITIVE_TOPIC_WARNING, validateAndClassify } from "../utils/contentValidator.js";

const wizardGlobal = globalThis;
const SLUG_EN_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const YOUTUBE_ID_RE = /^[a-zA-Z0-9_-]{11}$/;
const WORD_WARN = 900;
const WORD_DEEP = 1400;

function countWords(raw) {
  return String(raw || "")
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
}

function runBlockingChecks(data) {
  const errors = [];
  const slug = data.slug.trim();
  if (!slug) {
    errors.push("חסרה כתובת באנגלית קטנה (slug).");
  } else if (!SLUG_EN_RE.test(slug)) {
    errors.push("הכתובת באנגלית קטנה, מקפים בלבד, בלי רווחים.");
  }

  const tagParts = data.tags
    .split(/[,،]/)
    .map((tag) => tag.trim())
    .filter(Boolean);

  if (!tagParts.length) {
    errors.push("חסרות תגיות. רק מהרשימה בקובץ התגיות.");
  }

  for (const tag of tagParts) {
    if (!ARTICLE_TAG_WHITELIST_SET.has(tag)) {
      errors.push(`תגית לא ברשימה: "${tag}".`);
    }
  }

  if (!data.questionForSchema.trim()) errors.push("חסרה שאלה למנועי חיפוש.");
  if (!data.aha.trim()) errors.push("חסרה תובנת ליבה.");
  if (!data.imageAlt.trim()) errors.push("חסר תיאור תמונה.");

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

/** טיוטת MDX להורדה מקומית — בלי מודל חיצוני */
function buildMdxStub(data) {
  const today = new Date().toISOString().slice(0, 10);
  const slug = data.slug.trim() || "draft-article";
  const tagParts = data.tags
    .split(/[,،]/)
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
image: "/uploads/${slug}.jpg"
isPremium: ${Boolean(data.isPremium)}
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
    "#wiz-topic, #wiz-aha, #wiz-question-schema, #wiz-image-alt, #wiz-bottom-line, #wiz-inversion, #wiz-slug, #wiz-summary, #wiz-points, #wiz-tags, #wiz-youtube, #wiz-body, #wiz-output"
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
      tags: fieldTrim("wiz-tags"),
      youtubeId: fieldTrim("wiz-youtube"),
      body: fieldValue("wiz-body"),
    };
  };

  const updateWordCountAndPreflight = () => {
    const data = collectData();
    const wordCount = countWords(data.body);

    if (wordCountEl instanceof HTMLElement) {
      wordCountEl.textContent = `מילים בטיוטה: ${wordCount}`;
    }

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
          : "אין אזהרות. אם אין חסימות באדום, אפשר לשלב 3.";
    }
  };

  const render = () => {
    steps.forEach((step, index) => step.classList.toggle("hidden", index + 1 !== current));

    if (progress instanceof HTMLElement) {
      progress.style.width = `${(current / 3) * 100}%`;
    }
    if (stepLabel instanceof HTMLElement) {
      stepLabel.textContent = `שלב ${current} מתוך 3`;
    }

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
    }
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
    const defaultImagePath = data.slug ? `/uploads/${data.slug}.jpg` : "/uploads/[slug].jpg";
    const roboticBannedList = ROBOTIC_BLOCKLIST.join(", ");

    return `[Role: Strategic Content Expert]
[Context: NeverMind Project]
Act as a high-end content strategist for NeverMind. Write an article about ${data.topic || "[Topic]"} for ${data.audience || "[Audience]"}. The core insight is ${data.aha || "[originalInsight]"}.${bottomLine}${inversionNote}

[Content policy — Hebrew instruction for the model]
חוקי תוכן: היה מודע לכך שנושאים כמו סמים, מין, פורנו, הימורים והתמכרויות (וביטויים קרובים באנגלית כגון drugs, porn, gambling, addiction) גורמים לזיהוי פרימיום בזרימת האתר. אם הנושא נוגע לכך, הגדר isPremium: true. השתמש בשפה ישירה אך אחראית. בלי סנסציה. בלי הנחיות מפרות חוק.

You MUST output a single MDX file with YAML frontmatter.

Mandatory frontmatter — always generate these keys with real, non-empty values (never placeholder text, never skip):
- questionForSchema
- originalInsight
- difficultyLevel (beginner | advanced | deep)
- mindShiftIntensity (integer 1–5)
- imageAlt

Forbidden robotic / corporate cliché vocabulary — do NOT use these strings anywhere in the entire output (including YAML values, title, description, and body). Case-insensitive; includes multi-word phrases:
${roboticBannedList}

Wizard inputs vs final file: Values typed in the wizard (topic, bullets, draft body inside [DRAFT_BODY_START]...[DRAFT_BODY_END]) may include rough notes or placeholder phrasing. The final MDX you produce must rewrite this into clean NeverMind voice and MUST obey every rule above. Do not paste robotic or filler phrasing from the draft into the published text.

Required frontmatter keys (all must be present with non-empty values where noted):
- title: Hebrew title
- description: meta description ~150-160 chars
- pubDate: YYYY-MM-DD
- author: default "השם לא משנה"
- questionForSchema: distilled search-facing question (Hebrew) — ${data.questionForSchema || "[fill]"}
- originalInsight: same core as the article spine — ${data.aha || "[fill]"}
- difficultyLevel: one of beginner | advanced | deep — use ${data.difficultyLevel}
- mindShiftIntensity: integer 1-5 — use ${data.mindShiftIntensity}
- imageAlt: Hebrew. Describe the CONCEPT the hero image stands for, not only pixels. Pattern: [brief visible scene] — [semantic role for the article]. Example shape: "אדם עומד מול מראה שבורה — ייצוג ויזואלי לפירוק האגו". Search engines use this for topical/philosophical context; keep concrete + interpretive in one line. Wizard draft: ${data.imageAlt || "[fill]"}
- slug: REQUIRED, English only, kebab-case, aligned with title — ${data.slug || "[Slug]"}
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
- Inside at least 2 headings above, weave 2-3 natural SEO phrases derived from the topic (use Hebrew patterns like: איך {topic}, איך להפסיק {topic}, פתרון ... בזוגיות when relevant).
- Two-layer writing: each paragraph has two sentences. First sentence simple and concrete. Second sentence deeper and more precise.
- Keep paragraphs short. No generic filler.
]`;
  };

  const goBack = () => {
    current = Math.max(1, current - 1);
    render();
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

  const onCopy = async () => {
    const output = document.getElementById("wiz-output");
    const copyBtn = document.getElementById("wiz-copy");
    if (!(output instanceof HTMLTextAreaElement) || !output.value.trim()) {
      return;
    }
    if (!(copyBtn instanceof HTMLButtonElement)) {
      return;
    }

    try {
      await navigator.clipboard.writeText(output.value);
      const originalText = copyBtn.textContent || "העתק ללוח";
      copyBtn.textContent = "הועתק";
      window.setTimeout(() => {
        copyBtn.textContent = originalText;
      }, 2000);
    } catch {
      /* ignore */
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
    render();
    updateWordCountAndPreflight();
  };

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

      const button = target.closest("#wiz-next, #wiz-back, #wiz-generate, #wiz-copy, #wiz-save");
      if (!button || !root.contains(button)) {
        return;
      }

      event.preventDefault();
      if (button.id === "wiz-back") goBack();
      else if (button.id === "wiz-next") goNext();
      else if (button.id === "wiz-generate") onGenerate();
      else if (button.id === "wiz-copy") void onCopy();
      else if (button.id === "wiz-save") void onSave();
      else if (button.id === "wiz-download-mdx") onDownloadMdx();
    },
    { signal }
  );

  function onDownloadMdx() {
    const saveStatus = document.getElementById("wiz-save-status");
    const data = collectData();
    persistDraft();
    const blockers = runBlockingChecks(data);
    if (blockers.length > 0) {
      if (saveStatus instanceof HTMLElement) {
        saveStatus.textContent = "לא ניתן להוריד לפני תיקון החסימות (שלב 2).";
      }
      return;
    }

    const raw = buildMdxStub(data);
    const slug = data.slug.trim() || "draft-article";
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
      saveStatus.textContent = "קובץ MDX הורד. להעביר ל־src/content/articles/ אחרי בדיקה.";
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
