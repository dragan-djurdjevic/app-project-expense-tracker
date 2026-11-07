// Spec: AR-011
// Lists every TC-* in spec/milestones/*.md and whether an automated test title with that ID exists.
// `node scripts/trace.mjs M2` exits non-zero if an automated (unit/integration/e2e) TC of M2 has no test.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const AUTOMATED = new Set(["unit", "integration", "e2e"]);
const target = process.argv[2]?.toUpperCase() ?? null;

if (target !== null && !/^M\d+$/.test(target)) {
  console.error(`Usage: yarn spec:trace [Mx]   (got "${process.argv[2]}")`);
  process.exit(2);
}

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

// 1. Test cases from the milestone files (struck-through rows are removed TCs).
const milestoneDir = join(root, "spec", "milestones");
const testCases = [];
for (const file of readdirSync(milestoneDir)
  .filter((f) => /^M\d+\.md$/.test(f))
  .sort()) {
  for (const line of readFileSync(join(milestoneDir, file), "utf8").split("\n")) {
    const match = /^\|\s*(~~)?\s*(TC-(M\d+)-\d{3})\s*(~~)?\s*\|\s*(~~)?\s*([a-z0-9]+)/.exec(line);
    if (match) {
      testCases.push({ id: match[2], milestone: match[3], level: match[6], removed: Boolean(match[1]) });
    }
  }
}

// 2. Test titles in tests/** (it/test/describe titles starting with a TC ID).
const titles = new Map();
const testFiles = walk(join(root, "tests")).filter((f) => /\.(test|spec)\.tsx?$/.test(f));
const TITLE = /\b(?:it|test)(?:\.(?:only|skip|todo|concurrent))?\(\s*(["'`])(TC-M\d+-\d{3})\b/g;
for (const file of testFiles) {
  const source = readFileSync(file, "utf8");
  for (const match of source.matchAll(TITLE)) {
    const list = titles.get(match[2]) ?? [];
    list.push(relative(root, file));
    titles.set(match[2], list);
  }
}

// 3. Report.
const missing = [];
for (const tc of testCases) {
  if (target && tc.milestone !== target) continue;
  let status;
  if (tc.removed) status = "removed";
  else if (!AUTOMATED.has(tc.level)) status = "validator";
  else if (titles.has(tc.id)) status = `ok (${[...new Set(titles.get(tc.id))].join(", ")})`;
  else {
    status = "MISSING";
    missing.push(tc.id);
  }
  console.log(`${tc.id.padEnd(10)} ${tc.level.padEnd(12)} ${status}`);
}

if (target && !testCases.some((tc) => tc.milestone === target)) {
  console.error(`No test cases found for ${target}.`);
  process.exit(1);
}
if (missing.length > 0) {
  console.error(`\n${missing.length} automated test case(s) without a test: ${missing.join(", ")}`);
  process.exit(target ? 1 : 0);
}
console.log(target ? `\nAll automated test cases of ${target} are traced.` : "");
