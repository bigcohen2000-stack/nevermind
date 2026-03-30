import { randomBytes, createHash } from "node:crypto";

const password = process.argv[2];

if (!password) {
  console.error("Usage: node scripts/hash-password.mjs <password>");
  process.exit(1);
}

const salt = randomBytes(16).toString("hex");
const hash = createHash("sha256").update(`${salt}:${password}`, "utf8").digest("hex");

process.stdout.write(`v1$${salt}$${hash}\n`);
