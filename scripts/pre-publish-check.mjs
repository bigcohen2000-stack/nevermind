/**
 * כניסה מ-node: מריץ את הלוגיקה ב-TypeScript דרך tsx.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "..");
const tsEntry = path.join(scriptDir, "pre-publish-check.ts");
const tsxCli = path.join(root, "node_modules", "tsx", "dist", "cli.mjs");

const r = spawnSync(process.execPath, [tsxCli, tsEntry], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});

process.exit(r.status === null ? 1 : r.status);
