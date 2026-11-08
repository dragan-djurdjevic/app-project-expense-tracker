// Spec: AR-009, AR-011, AR-012, AR-010, DS-006
// Builds the macOS app bundle, starts it with ARCHTRACKER_DATA_DIR set to a fresh temp dir and checks that the
// SQLite DB is created and migration versions 1, 2 are recorded.
import { execFileSync, spawn } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const EXPECTED_VERSIONS = "1\n2";
const TIMEOUT_MS = 20_000;

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
