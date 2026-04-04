import { readdir, readFile } from "fs/promises";
import { createInterface } from "readline/promises";
import { stdin as input, stdout as output } from "process";
import { join } from "path";

const ARTICLES_DIR = "./src/content/articles";
const ALLOWED_DRAFT_SLUGS = ["template"];

async function confirmContinue(draftCount) {
  const rl = createInterface({ input, output });
  try {
    const answer = await rl.question(`⚠️ יש ${draftCount} טיוטות. להמשיך? (yes/no): `);
    return answer.trim().toLowerCase() === "yes";
  } finally {
    rl.close();
  }
}

async function checkDrafts() {
  console.log("🔍 בודק סטטוס מאמרים לפני דיפלוי...\n");

  const files = await readdir(ARTICLES_DIR);
  const mdxFiles = files.filter((file) => file.endsWith(".mdx"));

  let hasErrors = false;
  let draftCount = 0;
  let publishedCount = 0;
  let blockingDraftCount = 0;

  for (const file of mdxFiles) {
    const content = await readFile(join(ARTICLES_DIR, file), "utf-8");
    const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);

    if (!frontmatterMatch) {
      console.error(`${file}: אין frontmatter תקין.`);
      hasErrors = true;
      continue;
    }

    const frontmatter = frontmatterMatch[1];
    const draftMatch = frontmatter.match(/draft:\s*(true|false)/);
    const titleMatch = frontmatter.match(/title:\s*["'](.+?)["']/);
    const slug = file.replace(".mdx", "");

    const isDraft = draftMatch?.[1] === "true";
    const title = titleMatch?.[1] || "ללא כותרת";

    if (isDraft) {
      draftCount++;
      const isAllowed = ALLOWED_DRAFT_SLUGS.some((allowed) => slug.includes(allowed));
      if (!isAllowed) {
        blockingDraftCount++;
        console.warn(`⚠️ ${file}: מסומן כ-DRAFT ("${title}")`);
        console.log("   → האם בטוח שזה לא אמור להתפרסם?");
      } else {
        console.log(`✅ ${file}: תבנית/טיוטה מותרת`);
      }
    } else {
      publishedCount++;
      console.log(`📄 ${file}: מוכן לפרסום ("${title}")`);
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log(`📊 סיכום: ${publishedCount} מאמרים לפרסום, ${draftCount} טיוטות`);
  console.log("=".repeat(50) + "\n");

  if (hasErrors) {
    console.error("נמצאו שגיאות קריטיות. הדיפלוי נעצר.");
    process.exit(1);
  }

  if (blockingDraftCount > 0) {
    const nonInteractive =
      process.env.NM_DEPLOY_NONINTERACTIVE === "1" ||
      process.env.CI === "true" ||
      !input.isTTY;

    if (nonInteractive) {
      console.warn(
        `⚠️ נמצאו ${blockingDraftCount} טיוטות שאינן ברשימת המותרים — ממשיכים בדיפלוי (מצב לא אינטראקטיבי / CI). ודא שזה מכוון.`,
      );
    } else {
      const shouldContinue = await confirmContinue(blockingDraftCount);
      if (!shouldContinue) {
        console.log("🛑 הדיפלוי בוטל על ידי המשתמש.");
        process.exit(0);
      }
    }
  }

  console.log("✅ בדיקת טיוטות הושלמה. ניתן להמשיך לדיפלוי.\n");
}

checkDrafts().catch((err) => {
  console.error("❌ שגיאה בבדיקה:", err.message);
  process.exit(1);
});
