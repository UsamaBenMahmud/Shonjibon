import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const ignored = new Set([".git", "node_modules", "dist", "coverage", ".vercel"]);
const secretPatterns = [
  /\bsb_secret_[A-Za-z0-9_-]{20,}/g,
  /\bsk_(?:live|test)_[A-Za-z0-9]{16,}/g,
  /\bSUPABASE_SERVICE_ROLE_KEY\s*[:=]\s*["']?([A-Za-z0-9._-]{30,})/g,
];
const findings = [];

async function scan(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!ignored.has(entry.name) && !entry.name.startsWith(".env")) {
        await scan(path.join(directory, entry.name));
      }
      continue;
    }
    if (!entry.isFile() || entry.name.startsWith(".env") || entry.name.endsWith(".lock")) continue;
    const file = path.join(directory, entry.name);
    const contents = await readFile(file, "utf8").catch(() => "");
    for (const pattern of secretPatterns) {
      pattern.lastIndex = 0;
      if (pattern.test(contents)) findings.push(path.relative(root, file));
    }
  }
}

await scan(root);
if (findings.length) {
  console.error(`Potential leaked credentials found in:\n${[...new Set(findings)].join("\n")}`);
  process.exitCode = 1;
} else {
  console.log("No matching high-confidence secret patterns found.");
}
