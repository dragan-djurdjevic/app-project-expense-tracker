// Spec: AR-009, AR-011, AR-012, AR-010, AR-013, DS-006, DEMO-003, DEMO-004
// Builds the macOS app bundle, starts it with ARCHTRACKER_DATA_DIR set to a fresh temp dir and checks that the
// SQLite DB is created and migration versions 1, 2 are recorded. Then checks the demo profile row of AR-012:
// separate, seeded and resettable, with the live tracker.db unchanged.
import { execFileSync, spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const EXPECTED_VERSIONS = "1\n2";
const TIMEOUT_MS = 20_000;
const DEMO_TIMEOUT_MS = 30_000;
/** DEMO-003 investor names, sorted. */
const DEMO_INVESTORS = [
  "Greenleaf Properties",
  "Harbor City Council",
  "Northwind Developments",
  "Summit Retail Group",
].join("\n");

function log(message) {
  console.log(`[smoke:mac] ${message}`);
}

function findBinary() {
  const bundleDir = join(root, "src-tauri", "target", "release", "bundle", "macos");
  const app = readdirSync(bundleDir).find((name) => name.endsWith(".app"));
  if (!app) throw new Error(`No .app bundle in ${bundleDir}`);
  const macosDir = join(bundleDir, app, "Contents", "MacOS");
  const binary = readdirSync(macosDir).find((name) => statSync(join(macosDir, name)).isFile());
  if (!binary) throw new Error(`No binary in ${macosDir}`);
  return join(macosDir, binary);
}

function migrationVersions(dbFile) {
  try {
    return execFileSync("sqlite3", [dbFile, "SELECT version FROM schema_migrations ORDER BY version"], {
      encoding: "utf8",
    }).trim();
  } catch {
    return null;
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Runs a query with the sqlite3 CLI; null when the DB or table is not (yet) there. */
function query(dbFile, sql) {
  if (!existsSync(dbFile)) return null;
  try {
    return execFileSync("sqlite3", [dbFile, sql], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return null;
  }
}

function sha256(file) {
  return createHash("sha256").update(readFileSync(file)).digest("hex");
}

async function stop(child, state) {
  if (!state.exited) child.kill("SIGTERM");
  await sleep(500);
  if (!state.exited && child.exitCode === null) child.kill("SIGKILL");
  await sleep(500);
}

/**
 * AR-012 demo row: starts the app on `<root>`, waits up to 30 s until `check()` returns null (= condition met),
 * then kills the process. `check()` returns a description of what is still missing.
 */
async function runUntil(binary, dataDir, label, check) {
  log(`${label}: starting`);
  const child = spawn(binary, [], { env: { ...process.env, ARCHTRACKER_DATA_DIR: dataDir }, stdio: "inherit" });
  const state = { exited: null };
  child.on("exit", (code, signal) => {
    state.exited = { code, signal };
  });
  let missing = "not checked";
  try {
    const deadline = Date.now() + DEMO_TIMEOUT_MS;
    while (Date.now() < deadline && !state.exited) {
      missing = check();
      if (missing === null) break;
      await sleep(500);
    }
    if (state.exited)
      throw new Error(`${label}: app exited early (code ${state.exited.code}, signal ${state.exited.signal})`);
    if (missing !== null) throw new Error(`${label}: ${missing} within ${DEMO_TIMEOUT_MS / 1000} s`);
    log(`${label}: OK`);
  } finally {
    await stop(child, state);
  }
}

/** AR-012 "Demo profile is separate, seeded and resettable", steps (1)–(4). */
async function demoChecks(binary, dataDir) {
  const liveDb = join(dataDir, "tracker.db");
  const demoDir = join(dataDir, "demo");
  const demoDb = join(demoDir, "tracker.db");
  const profileFile = join(dataDir, "profile.json");
  const resetMarker = join(demoDir, ".reset");
  const investorCount = (db) => query(db, "SELECT COUNT(*) FROM investor");

  await runUntil(binary, dataDir, "(1) live", () =>
    investorCount(liveDb) === "0" ? null : `live tracker.db investors = ${investorCount(liveDb)}, expected 0`,
  );
  const liveHash = sha256(liveDb);
  const assertLiveUnchanged = (step) => {
    if (sha256(liveDb) !== liveHash) throw new Error(`${step}: SHA-256 of <root>/tracker.db changed`);
    log(`${step}: <root>/tracker.db unchanged (SHA-256 ${liveHash.slice(0, 12)}…)`);
  };

  writeFileSync(profileFile, JSON.stringify({ profile: "demo" }));
  await runUntil(binary, dataDir, "(2) demo", () => {
    const investors = investorCount(demoDb);
    const invoices = query(demoDb, "SELECT COUNT(*) FROM invoice");
    const documents = join(demoDir, "documents");
    const pdfs = existsSync(documents)
      ? readdirSync(documents, { recursive: true }).filter((name) => String(name).endsWith(".pdf")).length
      : 0;
    if (investors === "4" && invoices === "39" && pdfs === 3) return null;
    return `demo DB investors = ${investors}, invoices = ${invoices}, PDFs = ${pdfs} (expected 4, 39, 3)`;
  });
  assertLiveUnchanged("(2)");

  execFileSync("sqlite3", [demoDb, "UPDATE investor SET name = 'Changed'"]);
  writeFileSync(resetMarker, "");
  await runUntil(binary, dataDir, "(3) demo reset", () => {
    const names = query(demoDb, "SELECT name FROM investor ORDER BY name");
    if (names === DEMO_INVESTORS && !existsSync(resetMarker)) return null;
    return `demo investor names = ${JSON.stringify(names)}, .reset present = ${existsSync(resetMarker)}`;
  });
  assertLiveUnchanged("(3)");

  writeFileSync(profileFile, JSON.stringify({ profile: "live" }));
  await runUntil(binary, dataDir, "(4) live", () =>
    investorCount(liveDb) === "0" ? null : `live tracker.db investors = ${investorCount(liveDb)}, expected 0`,
  );
  assertLiveUnchanged("(4)");
}

async function main() {
  log("building app bundle (tauri build --bundles app)");
  execFileSync("yarn", ["tauri", "build", "--bundles", "app"], { cwd: root, stdio: "inherit" });

  const binary = findBinary();
  const dataDir = mkdtempSync(join(tmpdir(), "archtracker-smoke-"));
  const dbFile = join(dataDir, "tracker.db");
  log(`starting ${binary} with ARCHTRACKER_DATA_DIR=${dataDir}`);

  const child = spawn(binary, [], { env: { ...process.env, ARCHTRACKER_DATA_DIR: dataDir }, stdio: "inherit" });
  let exited = null;
  child.on("exit", (code, signal) => {
    exited = { code, signal };
  });

  try {
    const deadline = Date.now() + TIMEOUT_MS;
    let version = null;
    while (Date.now() < deadline) {
      if (exited) break;
      if (existsSync(dbFile)) {
        version = migrationVersions(dbFile);
        if (version === EXPECTED_VERSIONS) break;
      }
      await sleep(500);
    }
    if (exited) throw new Error(`app exited early (code ${exited.code}, signal ${exited.signal})`);
    if (!existsSync(dbFile)) throw new Error(`tracker.db not created in ${dataDir} within ${TIMEOUT_MS / 1000} s`);
    if (version !== EXPECTED_VERSIONS) {
      throw new Error(
        `schema_migrations versions = ${JSON.stringify(version)}, expected ${JSON.stringify(EXPECTED_VERSIONS)}`,
      );
    }
    if (child.exitCode !== null) throw new Error("app process is not alive");
    log("app alive, tracker.db created, migration versions 1, 2 recorded");
    if (!exited) child.kill("SIGTERM");
    await sleep(500);
    if (!exited && child.exitCode === null) child.kill("SIGKILL");
    await sleep(500);
    await demoChecks(binary, dataDir);
  } finally {
    if (!exited) child.kill("SIGTERM");
    await sleep(500);
    if (!exited && child.exitCode === null) child.kill("SIGKILL");
    rmSync(dataDir, { recursive: true, force: true });
  }
}

main().then(
  () => log("PASS"),
  (error) => {
    console.error(`[smoke:mac] FAIL: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  },
);
