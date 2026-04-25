import { glossaryConcepts } from "../data/glossary.ts";
import { getVideoTopic } from "../data/video-topics.ts";

const YOUTUBE_ID_RE = /^[a-zA-Z0-9_-]{11}$/;

export const GENERATOR_EXTRA_BLOCKLIST = [
  "מסע",
  "מהפכני",
  "תהליך",
  "להתחבר לעצמך",
  "מרחב בטוח",
];

export const DEFAULT_FINAL_QUESTION = "איזה מנגנון מתוך המאמר אתה מזהה עכשיו אצלך?";

const DEFAULT_REFLECTION_QUESTIONS = [
  "מה אני בטוח בו מהר מדי",
  "איזה פירוש אני מצמיד לעובדה",
  "מה משתנה אם אני עוצר לפני תגובה",
];

const DEFAULT_VIDEO_TOPIC_LABEL = "עוד סרטונים בנושא";
const DEFAULT_VIDEO_SECTION_INTRO = "אם מה שקראת נוגע באותו מנגנון, אפשר להמשיך מכאן לעוד פירוקים קצרים וישירים.";

function cleanText(value) {
  return String(value ?? "").replace(/\r\n?/g, "\n").trim();
}

function collapseWhitespace(value) {
  return cleanText(value).replace(/\s+/g, " ");
}

function splitLines(value) {
  return cleanText(value)
    .split("\n")
    .map((item) => collapseWhitespace(item))
    .filter(Boolean);
}

function splitParagraphs(value) {
  return cleanText(value)
    .split(/\n{2,}/)
    .map((item) => collapseWhitespace(item))
    .filter(Boolean);
}

function uniq(values) {
  return [...new Set(values.filter(Boolean))];
}

function slugify(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/['".,!?()[\]{}]+/g, " ")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function fallbackSlug() {
  return `article-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}`;
}

function yamlQuote(value) {
  return String(value ?? "").replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeHeading(value, fallback) {
  return collapseWhitespace(value) || fallback;
}

function normalizeParagraphPair(value, fallback) {
  const raw = Array.isArray(value)
    ? value.map((item) => collapseWhitespace(item)).filter(Boolean)
    : [];
  const out = uniq([...raw, ...fallback]).slice(0, 2);
  while (out.length < 2) {
    out.push(fallback[out.length] || fallback[0] || "כאן צריך ניסוח קצר ומדויק יותר.");
  }
  return out;
}

function normalizeQuickTakeaways(value, fallback) {
  const items = Array.isArray(value)
    ? value.map((item) => collapseWhitespace(item)).filter(Boolean)
    : [];
  const out = uniq([...items, ...fallback]).slice(0, 3);
  while (out.length < 3) {
    out.push(`נקודה קצרה ${out.length + 1}`);
  }
  return out;
}

function normalizeReflectionQuestions(value, fallback = DEFAULT_REFLECTION_QUESTIONS) {
  const items = Array.isArray(value)
    ? value.map((item) => collapseWhitespace(item).replace(/\?+$/, ""))
    : [];
  const out = uniq([...items, ...fallback]).slice(0, 3).map((item) => item.trim());
  while (out.length < 3) {
    out.push(fallback[out.length] || fallback[0]);
  }
  return out;
}

function normalizeFaq(value) {
  return asArray(value)
    .map((item) => ({
      question: collapseWhitespace(item?.question),
      answer: collapseWhitespace(item?.answer),
    }))
    .filter((item) => item.question && item.answer)
    .slice(0, 3);
}

function sameish(a, b) {
  const normalize = (value) =>
    collapseWhitespace(value)
      .replace(/[.,/#!$%^&*;:{}=\-_`~()"'""׳'?]/g, "")
      .trim();
  return Boolean(normalize(a) && normalize(a) === normalize(b));
}

function resolveRelatedConcepts(candidates) {
  const wanted = uniq(asArray(candidates).map((item) => collapseWhitespace(item).toLowerCase())).filter(Boolean);
  const seen = new Set();
  const matches = [];

  for (const candidate of wanted) {
    const match = glossaryConcepts.find((concept) => {
      const slug = concept.slug.toLowerCase();
      const title = concept.title.trim().toLowerCase();
      const keywords = asArray(concept.keywords).map((item) => collapseWhitespace(item).toLowerCase());
      return (
        candidate === slug ||
        candidate === title ||
        keywords.includes(candidate) ||
        candidate.includes(title) ||
        title.includes(candidate)
      );
    });

    if (match && !seen.has(match.slug)) {
      seen.add(match.slug);
      matches.push(match.slug);
    }
  }

  return matches.slice(0, 3);
}

function estimateReadTime(text) {
  const words = collapseWhitespace(text).split(/\s+/).filter(Boolean).length;
  if (!words) return 4;
  return Math.max(1, Math.ceil(words / 200));
}

function normalizeTags(tags) {
  if (Array.isArray(tags)) {
    return tags.map((item) => collapseWhitespace(item)).filter(Boolean);
  }
  return String(tags || "")
    .split(",")
    .map((item) => collapseWhitespace(item))
    .filter(Boolean);
}

function normalizeRelatedVideos(videos, fallbackTitle) {
  return asArray(videos)
    .map((item, index) => ({
      youtubeId: collapseWhitespace(item?.youtubeId),
      title: collapseWhitespace(item?.title) || `${fallbackTitle} - סרטון ${index + 1}`,
    }))
    .filter((item) => YOUTUBE_ID_RE.test(item.youtubeId))
    .slice(0, 3);
}

function extractJsonObject(raw) {
  const text = cleanText(raw)
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();

  if (text.startsWith("{") && text.endsWith("}")) {
    return text;
  }

  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first >= 0 && last > first) {
    return text.slice(first, last + 1);
  }

  return text;
}

function serializeArrayBlock(key, items) {
  if (!items.length) return [];
  return [ `${key}:`, ...items.map((item) => `  - "${yamlQuote(item)}"`) ];
}

function serializeFaq(items) {
  if (!items.length) return [];
  const lines = ["faq:"];
  for (const item of items) {
    lines.push(`  - question: "${yamlQuote(item.question)}"`);
    lines.push(`    answer: "${yamlQuote(item.answer)}"`);
  }
  return lines;
}

function serializeRelatedVideos(items) {
  if (!items.length) return [];
  const lines = ["relatedVideos:"];
  for (const item of items) {
    lines.push(`  - youtubeId: "${yamlQuote(item.youtubeId)}"`);
    lines.push(`    title: "${yamlQuote(item.title)}"`);
  }
  return lines;
}

function buildFallbackPayload(data) {
  const points = splitLines(data.points).slice(0, 3);
  const draftParagraphs = splitParagraphs(data.body);
  const openingFallback = draftParagraphs.slice(0, 2);
  const firstOpening =
    openingFallback[0] ||
    collapseWhitespace(data.summary) ||
    collapseWhitespace(data.topic) ||
    "כאן צריך פתיחה חדה שמתחילה מהכאב המיידי.";
  const secondOpening =
    openingFallback[1] ||
    collapseWhitespace(data.aha) ||
    "כאן צריך להסביר מה ההנחה הסמויה שמפעילה את הכאב הזה.";

  return {
    title: collapseWhitespace(data.topic) || "כותרת זמנית",
    description: collapseWhitespace(data.summary) || collapseWhitespace(data.aha) || "תיאור קצר ומדויק למאמר.",
    simpleSummary:
      collapseWhitespace(data.summary) ||
      "המאמר הזה מפרק את ההנחה שמפעילה את הכאב, בלי להסתיר את המנגנון ובלי לעטוף אותו במילים רכות.",
    quickTakeaways: normalizeQuickTakeaways(points, [
      "הכאב לא מתחיל באירוע אלא בפירוש שמודבק עליו",
      "לפני תגובה בודקים מה קרה ומה סיפרת לעצמך שזה אומר",
      "שקט נבנה מהתאמה לעובדה, לא משליטה במציאות",
    ]),
    originalInsight:
      collapseWhitespace(data.aha) ||
      "הכאב לא נוצר רק ממה שקרה, אלא מהנחת היסוד שמנסה לכפות על המציאות צורה אחרת.",
    bottomLine:
      collapseWhitespace(data.bottomLine) ||
      "ככל שאתה מפסיק להילחם בעובדה, כך נשאר יותר מקום לראות מה באמת קורה.",
    questionForSchema:
      collapseWhitespace(data.questionForSchema) || collapseWhitespace(data.topic) || "מה באמת קורה כאן",
    inversionQuestion:
      collapseWhitespace(data.inversionNote) ||
      "מה קורה אם מה שנראה לך כמו הבעיה הוא רק הסימן, ולא הסיבה האמיתית לסבל?",
    finalQuestion: DEFAULT_FINAL_QUESTION,
    reflectionQuestions: [...DEFAULT_REFLECTION_QUESTIONS],
    relatedConceptCandidates: [],
    faq: [],
    videoTopicLabel: collapseWhitespace(data.videoTopicLabel),
    videoSectionIntro: collapseWhitespace(data.videoSectionIntro),
    body: {
      opening: [firstOpening, secondOpening],
      mechanism: {
        heading: "מה באמת קורה כאן",
        paragraphs: normalizeParagraphPair(draftParagraphs.slice(2, 4), [
          collapseWhitespace(data.aha) || "יש כאן מנגנון שחוזר על עצמו גם אם הצורה החיצונית משתנה.",
          "המנגנון הזה מתחיל בפער בין מה שאתה דורש מהמציאות לבין מה שקורה בפועל.",
        ]),
      },
      inversion: {
        heading: "איפה ההנחה נשברת",
        paragraphs: normalizeParagraphPair(draftParagraphs.slice(4, 6), [
          collapseWhitespace(data.inversionNote) ||
            "ברגע שבודקים קודם את העובדה ורק אחר כך את הסיפור עליה, משהו מרכזי נשבר.",
          "מה שנשבר הוא ההרגל להניח שהכאב מוכיח שהמציאות עצמה שגויה.",
        ]),
      },
      experiment: {
        heading: "ניסוי קצר",
        paragraphs: [
          "עצור לרגע לפני התגובה הבאה ושאל מה באמת קרה כאן בלי לפרש עדיין.",
          "אחר כך בדוק איזה סיפור מהיר הדבקת לעובדה, ומה קורה כשהסיפור הזה לא מקבל סמכות אוטומטית.",
        ],
      },
      practical: {
        heading: "סיכום פרקטי",
        paragraphs: normalizeParagraphPair(draftParagraphs.slice(6, 8), [
          collapseWhitespace(data.bottomLine) || "הצעד הבא לא דורש דרמה אלא דיוק.",
          "בפעם הבאה שהמנגנון הזה מופיע, תבדוק קודם את המציאות ורק אחר כך את ההרגל שלך להגיב אליה.",
        ]),
      },
    },
  };
}

function normalizeBody(body, fallbackBody) {
  const safe = body && typeof body === "object" ? body : {};

  return {
    opening: normalizeParagraphPair(safe.opening, fallbackBody.opening),
    mechanism: {
      heading: normalizeHeading(safe.mechanism?.heading, fallbackBody.mechanism.heading),
      paragraphs: normalizeParagraphPair(safe.mechanism?.paragraphs, fallbackBody.mechanism.paragraphs),
    },
    inversion: {
      heading: normalizeHeading(safe.inversion?.heading, fallbackBody.inversion.heading),
      paragraphs: normalizeParagraphPair(safe.inversion?.paragraphs, fallbackBody.inversion.paragraphs),
    },
    experiment: {
      heading: normalizeHeading(safe.experiment?.heading, fallbackBody.experiment.heading),
      paragraphs: normalizeParagraphPair(safe.experiment?.paragraphs, fallbackBody.experiment.paragraphs),
    },
    practical: {
      heading: normalizeHeading(safe.practical?.heading, fallbackBody.practical.heading),
      paragraphs: normalizeParagraphPair(safe.practical?.paragraphs, fallbackBody.practical.paragraphs),
    },
  };
}

function normalizePayload(rawPayload, data) {
  const fallback = buildFallbackPayload(data);
  const safe = rawPayload && typeof rawPayload === "object" && !Array.isArray(rawPayload) ? rawPayload : {};

  const payload = {
    title: collapseWhitespace(safe.title) || fallback.title,
    description: collapseWhitespace(safe.description) || fallback.description,
    simpleSummary: collapseWhitespace(safe.simpleSummary) || fallback.simpleSummary,
    quickTakeaways: normalizeQuickTakeaways(safe.quickTakeaways, fallback.quickTakeaways),
    originalInsight: collapseWhitespace(safe.originalInsight) || fallback.originalInsight,
    bottomLine: collapseWhitespace(safe.bottomLine) || fallback.bottomLine,
    questionForSchema: collapseWhitespace(safe.questionForSchema) || fallback.questionForSchema,
    inversionQuestion: collapseWhitespace(safe.inversionQuestion) || fallback.inversionQuestion,
    finalQuestion: collapseWhitespace(safe.finalQuestion) || fallback.finalQuestion,
    reflectionQuestions: normalizeReflectionQuestions(safe.reflectionQuestions, fallback.reflectionQuestions),
    relatedConceptCandidates: uniq(
      asArray(safe.relatedConceptCandidates)
        .map((item) => collapseWhitespace(item))
        .filter(Boolean),
    ).slice(0, 4),
    faq: normalizeFaq(safe.faq),
    videoTopicLabel: collapseWhitespace(safe.videoTopicLabel) || fallback.videoTopicLabel,
    videoSectionIntro: collapseWhitespace(safe.videoSectionIntro) || fallback.videoSectionIntro,
    body: normalizeBody(safe.body, fallback.body),
  };

  return payload;
}

function buildBodyMdx(payload) {
  const sections = [];

  for (const paragraph of payload.body.opening) {
    sections.push(paragraph);
  }

  sections.push(`## ${payload.body.mechanism.heading}`);
  sections.push(...payload.body.mechanism.paragraphs);

  sections.push(`## ${payload.body.inversion.heading}`);
  sections.push(...payload.body.inversion.paragraphs);

  sections.push(`### ${payload.body.experiment.heading}`);
  sections.push(...payload.body.experiment.paragraphs);

  sections.push(`## ${payload.body.practical.heading}`);
  sections.push(...payload.body.practical.paragraphs);

  sections.push(`> ${payload.bottomLine}`);
  sections.push(`<PremiumBreak servicesHref="/services/" archiveHref="/articles/" />`);
  sections.push(`<InquirySection />`);

  return sections.join("\n\n");
}

function serializeFrontmatter(frontmatter) {
  const lines = [];

  lines.push(`title: "${yamlQuote(frontmatter.title)}"`);
  lines.push(`description: "${yamlQuote(frontmatter.description)}"`);
  lines.push(`simpleSummary: "${yamlQuote(frontmatter.simpleSummary)}"`);
  lines.push(...serializeArrayBlock("quickTakeaways", frontmatter.quickTakeaways));
  lines.push(`originalInsight: "${yamlQuote(frontmatter.originalInsight)}"`);
  lines.push(`bottomLine: "${yamlQuote(frontmatter.bottomLine)}"`);
  lines.push(`slug: "${yamlQuote(frontmatter.slug)}"`);
  lines.push(`pubDate: "${yamlQuote(frontmatter.pubDate)}"`);
  lines.push(`author: "${yamlQuote(frontmatter.author)}"`);
  lines.push(`tags: [${frontmatter.tags.map((item) => `"${yamlQuote(item)}"`).join(", ")}]`);
  lines.push(`image: "${yamlQuote(frontmatter.image)}"`);
  lines.push(`imageAlt: "${yamlQuote(frontmatter.imageAlt)}"`);
  lines.push(`canonicalUrl: "${yamlQuote(frontmatter.canonicalUrl)}"`);
  if (frontmatter.keywords) {
    lines.push(`keywords: "${yamlQuote(frontmatter.keywords)}"`);
  }
  if (frontmatter.youtubeId) {
    lines.push(`youtubeId: "${yamlQuote(frontmatter.youtubeId)}"`);
  }
  if (frontmatter.videoSummaryPoints?.length) {
    lines.push(...serializeArrayBlock("videoSummaryPoints", frontmatter.videoSummaryPoints));
  }
  lines.push(`isPremium: ${frontmatter.isPremium}`);
  lines.push(`draft: ${frontmatter.draft}`);
  if (frontmatter.audience) {
    lines.push(`audience: "${yamlQuote(frontmatter.audience)}"`);
  }
  if (frontmatter.difficulty) {
    lines.push(`difficulty: "${yamlQuote(frontmatter.difficulty)}"`);
  }
  if (frontmatter.intendedAudience) {
    lines.push(`intendedAudience: "${yamlQuote(frontmatter.intendedAudience)}"`);
  }
  lines.push(`readTime: ${frontmatter.readTime}`);
  lines.push(`isPublic: ${frontmatter.isPublic}`);
  lines.push(`workflowStatus: "${yamlQuote(frontmatter.workflowStatus)}"`);
  lines.push(`difficultyLevel: "${yamlQuote(frontmatter.difficultyLevel)}"`);
  lines.push(`mindShiftIntensity: ${frontmatter.mindShiftIntensity}`);
  if (frontmatter.inversionNote) {
    lines.push(`inversionNote: "${yamlQuote(frontmatter.inversionNote)}"`);
  }
  lines.push(`inversionQuestion: "${yamlQuote(frontmatter.inversionQuestion)}"`);
  lines.push(`finalQuestion: "${yamlQuote(frontmatter.finalQuestion)}"`);
  lines.push(...serializeArrayBlock("reflectionQuestions", frontmatter.reflectionQuestions));
  if (frontmatter.relatedConcepts?.length) {
    lines.push(`relatedConcepts: [${frontmatter.relatedConcepts.map((item) => `"${yamlQuote(item)}"`).join(", ")}]`);
  }
  lines.push(`questionForSchema: "${yamlQuote(frontmatter.questionForSchema)}"`);
  lines.push(...serializeFaq(frontmatter.faq || []));
  lines.push(`hubPosition: "${yamlQuote(frontmatter.hubPosition)}"`);
  lines.push(`hubOrder: ${frontmatter.hubOrder}`);
  lines.push(`journeyTopic: "${yamlQuote(frontmatter.journeyTopic)}"`);
  if (frontmatter.videoTopicLabel) {
    lines.push(`videoTopicLabel: "${yamlQuote(frontmatter.videoTopicLabel)}"`);
  }
  if (frontmatter.videoSectionIntro) {
    lines.push(`videoSectionIntro: "${yamlQuote(frontmatter.videoSectionIntro)}"`);
  }
  if (frontmatter.videoTopicKey) {
    lines.push(`videoTopicKey: "${yamlQuote(frontmatter.videoTopicKey)}"`);
  }
  lines.push(...serializeRelatedVideos(frontmatter.relatedVideos || []));

  return lines.join("\n");
}

export function parseStructuredArticleJson(raw) {
  const cleaned = extractJsonObject(raw);

  if (!cleaned) {
    return { payload: null, errors: ["חסר JSON להדבקה."], warnings: [] };
  }

  try {
    const parsed = JSON.parse(cleaned);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { payload: null, errors: ["הפלט החיצוני חייב להיות אובייקט JSON אחד."], warnings: [] };
    }
    return { payload: parsed, errors: [], warnings: [] };
  } catch {
    return {
      payload: null,
      errors: ["ה־JSON לא תקין. צריך להדביק אובייקט אחד, בלי הערות ובלי פסיקים מיותרים."],
      warnings: [],
    };
  }
}

export function findBlockedPhrases(text, phrases) {
  const haystack = cleanText(text).toLowerCase();
  return uniq(
    phrases
      .map((item) => collapseWhitespace(item))
      .filter(Boolean)
      .filter((item) => haystack.includes(item.toLowerCase())),
  );
}

export function buildStructuredArticlePrompt(data, { blockedWords = [] } = {}) {
  const tags = normalizeTags(data.tags).join(", ");
  const seoPhrases = splitLines(data.points).join(", ");
  const relatedVideos = normalizeRelatedVideos(data.relatedVideos, collapseWhitespace(data.topic) || "המאמר הזה");
  const blocked = uniq([...blockedWords, ...GENERATOR_EXTRA_BLOCKLIST]).join(", ");

  return `You are the Hebrew lead writer for NeverMind.

Return strict JSON only.
No markdown.
No code fences.
No commentary.
No YAML.
No MDX.

Main goal:
Write one sharp Hebrew article for NeverMind.
The article must feel logical, direct, clean, human-to-human, and grounded in reality.

Core rules:
- Rule of 10: explain the hidden cognitive mechanism so clearly that a 10-year-old could follow the core logic.
- Speak directly to the reader in active voice.
- Stay concrete before abstract.
- No academic phrasing.
- No therapy fluff.
- No coaching fluff.
- No marketing fluff.
- No exclamation marks.
- Never use these words or phrases: ${blocked}.

Inversion rule:
- The inversion section must show observation before assumption.
- It must expose the hidden root cause of the reader's pain.
- It must prove that the reader's first assumption about reality is intellectually flawed.

JSON rules:
- Escape internal double quotes correctly.
- No trailing commas.
- The JSON must be immediately parsable.

Output shape:
{
  "title": "",
  "description": "",
  "simpleSummary": "",
  "quickTakeaways": ["", "", ""],
  "originalInsight": "",
  "bottomLine": "",
  "questionForSchema": "",
  "inversionQuestion": "",
  "finalQuestion": "",
  "reflectionQuestions": ["", "", ""],
  "relatedConceptCandidates": ["", "", ""],
  "faq": [
    { "question": "", "answer": "" }
  ],
  "videoTopicLabel": "",
  "videoSectionIntro": "",
  "body": {
    "opening": ["", ""],
    "mechanism": {
      "heading": "",
      "paragraphs": ["", ""]
    },
    "inversion": {
      "heading": "",
      "paragraphs": ["", ""]
    },
    "experiment": {
      "heading": "",
      "paragraphs": ["", ""]
    },
    "practical": {
      "heading": "",
      "paragraphs": ["", ""]
    }
  }
}

Field rules:
- description: 145-160 characters when possible.
- simpleSummary: simpler than description. Do not duplicate it.
- quickTakeaways: exactly 3 short lines.
- faq: use [] if there is no real FAQ value.
- body.opening: exactly 2 short paragraphs.
- Each section must contain exactly 2 short paragraphs.
- Keep the article web-readable.

Writer context:
Topic: ${collapseWhitespace(data.topic) || "[topic]"}
Audience: ${collapseWhitespace(data.audience) || "[audience]"}
Core insight: ${collapseWhitespace(data.aha) || "[core insight]"}
Search question: ${collapseWhitespace(data.questionForSchema) || "[search question]"}
Description direction: ${collapseWhitespace(data.summary) || "[summary]"}
Bottom line direction: ${collapseWhitespace(data.bottomLine) || "[bottom line]"}
Tone: ${collapseWhitespace(data.tone) || "חד וישיר"}
SEO phrases to blend naturally: ${seoPhrases || "[none]"}
Allowed tags in the site system: ${tags || "[none yet]"}
Difficulty: ${collapseWhitespace(data.difficultyLevel) || "beginner"}
Mind shift intensity: ${collapseWhitespace(data.mindShiftIntensity) || "3"}
Image meaning: ${collapseWhitespace(data.imageAlt) || "[image meaning]"}
Draft notes:
${cleanText(data.body) || "[no draft notes]"}

Optional video context for section naming:
Main video exists: ${data.youtubeId ? "yes" : "no"}
Additional videos attached: ${relatedVideos.length}

Return JSON only.`;
}

export function buildArticleArtifacts(data, rawPayload = null) {
  const payload = normalizePayload(rawPayload, data);
  const relatedConcepts = resolveRelatedConcepts(payload.relatedConceptCandidates);
  const topicMedia = getVideoTopic(collapseWhitespace(data.videoTopicKey));
  const relatedVideos = normalizeRelatedVideos(payload.relatedVideos?.length ? payload.relatedVideos : data.relatedVideos, payload.title);
  const bodyMdx = buildBodyMdx(payload);
  const slug =
    collapseWhitespace(data.slug) ||
    slugify(payload.title) ||
    slugify(data.questionForSchema) ||
    fallbackSlug();
  const tags = normalizeTags(data.tags);
  const readTime = estimateReadTime(bodyMdx);

  const frontmatter = {
    title: payload.title,
    description: payload.description,
    simpleSummary: payload.simpleSummary,
    quickTakeaways: payload.quickTakeaways,
    originalInsight: payload.originalInsight,
    bottomLine: payload.bottomLine,
    slug,
    pubDate: new Date().toISOString().slice(0, 10),
    author: "השם לא משנה",
    tags,
    image: `/assets/images/articles/${slug}.webp`,
    imageAlt: collapseWhitespace(data.imageAlt) || payload.title,
    canonicalUrl: `https://nevermind.co.il/articles/${slug}/`,
    keywords: tags.join(", "),
    youtubeId: collapseWhitespace(data.youtubeId),
    videoSummaryPoints: collapseWhitespace(data.youtubeId) ? payload.quickTakeaways : [],
    isPremium: Boolean(data.isPremium),
    draft: true,
    audience: collapseWhitespace(data.audience),
    difficulty: data.difficultyLevel === "beginner" ? "beginner" : "advanced",
    intendedAudience: collapseWhitespace(data.audience),
    readTime,
    isPublic: true,
    workflowStatus: "writing",
    difficultyLevel: collapseWhitespace(data.difficultyLevel) || "beginner",
    mindShiftIntensity: Number(data.mindShiftIntensity) || 3,
    inversionNote: collapseWhitespace(data.inversionNote),
    inversionQuestion: payload.inversionQuestion,
    finalQuestion: payload.finalQuestion,
    reflectionQuestions: payload.reflectionQuestions,
    relatedConcepts,
    questionForSchema: payload.questionForSchema,
    faq: payload.faq,
    hubPosition: "latest",
    hubOrder: 999,
    journeyTopic: "general",
    videoTopicLabel: collapseWhitespace(data.videoTopicLabel) || topicMedia?.label || payload.videoTopicLabel || undefined,
    videoSectionIntro: collapseWhitespace(data.videoSectionIntro) || topicMedia?.intro || payload.videoSectionIntro || undefined,
    videoTopicKey: collapseWhitespace(data.videoTopicKey) || undefined,
    relatedVideos,
  };

  const frontmatterYaml = serializeFrontmatter(frontmatter);
  const mdx = `---\n${frontmatterYaml}\n---\n\n${bodyMdx}\n`;
  const bodyText = [
    payload.title,
    payload.description,
    payload.simpleSummary,
    payload.originalInsight,
    payload.bottomLine,
    bodyMdx,
  ].join("\n");

  const warnings = [];
  if (sameish(payload.description, payload.simpleSummary)) {
    warnings.push("description ו־simpleSummary כמעט זהים. עדיף לחדד ניסוח שונה לכל אחד.");
  }
  if (bodyMdx.includes(payload.finalQuestion)) {
    warnings.push("finalQuestion כבר מופיעה בגוף. התבנית גם מציגה אותה בסוף, אז עדיף לא לחזור עליה בטקסט.");
  }
  if (!relatedConcepts.length && payload.relatedConceptCandidates.length) {
    warnings.push("relatedConceptCandidates לא התאימו למילון המושגים הקיים, ולכן לא נכנסו ל־relatedConcepts.");
  }
  if (payload.description.length > 0 && (payload.description.length < 145 || payload.description.length > 160)) {
    warnings.push(`description יצא באורך ${payload.description.length} תווים. עדיף לכוון ל־145-160.`);
  }

  return {
    payload,
    mdx,
    warnings,
    bodyText,
    slug,
    imagePath: `public/assets/images/articles/${slug}.webp`,
  };
}

export function buildCursorPackage({ slug, mdx, imagePath }) {
  return `# Cursor Article Package

Target file: src/content/articles/${slug}.mdx
Hero image path: ${imagePath}
Action: create or replace the target file with the exact MDX below.

\`\`\`mdx
${mdx}
\`\`\`
`;
}
