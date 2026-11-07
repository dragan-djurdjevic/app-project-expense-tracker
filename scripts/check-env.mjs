// Spec: AR-006, AR-011, AR-012
// Verifies the developer machine prerequisites of AR-012 and prints what is missing.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { delimiter, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const results = [];

function run(cmd, args = []) {
  return execFileSync(cmd, args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function check(name, fn) {
  try {
    const detail = fn();
    results.push({ name, ok: true, detail });
  } catch (error) {
    const message = error instanceof Error ? error.message.split("\n")[0] : String(error);
    results.push({ name, ok: false, detail: message });
  }
}

function firstLine(text) {
  return text.split("\n")[0].trim();
}

check("Node 22 (nvm, .nvmrc)", () => {
  const nvmrc = readFileSync(new URL("../.nvmrc", import.meta.url), "utf8").trim();
  const major = process.versions.node.split(".")[0];
  if (major !== nvmrc) throw new Error(`node ${process.version}, .nvmrc wants ${nvmrc} (run \`nvm use\`)`);
  return process.version;
});

check("Corepack enabled", () => {
  // Under `yarn <script>`, Yarn 4 prepends a temporary bin folder with its own `yarn`; look past it.
  const skip = new Set([process.env.BERRY_BIN_FOLDER].filter(Boolean));
  const dirs = (process.env.PATH ?? "").split(delimiter).filter((dir) => dir && !skip.has(dir) && !/xfs-/.test(dir));
  const yarnPath = dirs.map((dir) => join(dir, "yarn")).find((path) => existsSync(path));
  if (!yarnPath) throw new Error("no `yarn` on PATH (run `corepack enable`)");
  const real = realpathSync(yarnPath);
  if (!real.includes("corepack")) throw new Error(`yarn at ${real} is not the Corepack shim (run \`corepack enable\`)`);
  return `corepack ${run("corepack", ["--version"])} (${yarnPath})`;
});

check("Yarn = packageManager", () => {
  const wanted = String(pkg.packageManager ?? "")
    .replace(/^yarn@/, "")
    .split("+")[0];
  const actual = run("yarn", ["--version"]);
  if (!wanted) throw new Error("package.json has no packageManager field");
  if (actual !== wanted) throw new Error(`yarn ${actual}, packageManager wants ${wanted}`);
  return actual;
});

check("Rust (rustc, cargo)", () => `${run("rustc", ["--version"])}; ${run("cargo", ["--version"])}`);

check("Rust targets", () => {
  const toolchain = readFileSync(new URL("../src-tauri/rust-toolchain.toml", import.meta.url), "utf8");
  const wanted = [...toolchain.matchAll(/"([a-z0-9_]+-[a-z0-9_-]+)"/g)].map((m) => m[1]);
  // Run inside src-tauri so rustup resolves the toolchain from rust-toolchain.toml.
  const installed = execFileSync("rustup", ["target", "list", "--installed"], {
    cwd: join(root, "src-tauri"),
    encoding: "utf8",
  })
    .trim()
    .split("\n")
    .map((s) => s.trim());
  const missing = wanted.filter((t) => !installed.includes(t));
  if (missing.length > 0)
    throw new Error(`missing: ${missing.join(", ")} (run \`rustup target add ${missing.join(" ")}\`)`);
  return installed.join(", ");
});

check("Xcode Command Line Tools", () => run("xcode-select", ["-p"]));
check("cargo-xwin", () => run("cargo", ["xwin", "--version"]));
check("nsis (makensis)", () => run("makensis", ["-VERSION"]));
check("llvm: clang", () => {
  // The Homebrew LLVM clang next to llvm-lib (`$(brew --prefix llvm)/bin` on PATH), not Apple's clang.
  const clang = join(dirname(run("which", ["llvm-lib"])), "clang");
  return `${clang} (${firstLine(run(clang, ["--version"]))})`;
});
check("llvm: llvm-lib", () => {
  const path = run("which", ["llvm-lib"]);
  return `${path} (${firstLine(run("llvm-lib", ["/?"]))})`;
});
check("lld-link", () => firstLine(run("lld-link", ["--version"])));
check("sqlite3 (smoke:mac)", () => run("sqlite3", ["--version"]).split(" ")[0]);

const width = Math.max(...results.map((r) => r.name.length));
for (const r of results) {
  console.log(`${r.ok ? "OK     " : "MISSING"}  ${r.name.padEnd(width)}  ${r.detail}`);
}
const failed = results.filter((r) => !r.ok);
if (failed.length > 0) {
  console.error(`\n${failed.length} prerequisite(s) missing — see README.md "Prerequisites".`);
  process.exit(1);
}
console.log("\nAll prerequisites present.");
