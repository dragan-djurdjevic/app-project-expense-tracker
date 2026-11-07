# Architecture Project Tracker (POC)

Desktop app (Tauri 2 + React + TypeScript + SQLite) for tracking architecture projects, investors,
subcontractors, contracts, invoices (with PDF) and analytics.

**This repository is spec-driven.** `spec/` is the source of truth; code is generated from it milestone by milestone.
Read [`CLAUDE.md`](CLAUDE.md) for the agent rules.

- Spec: [`spec/`](spec/) — start with [`00-overview.md`](spec/00-overview.md)
- Milestones and test cases: [`spec/milestones/`](spec/milestones/README.md)
- Validation reports: `validation/`
- Spec/code sync state: [`spec-lock.json`](spec-lock.json)

## Workflow (Claude Code)
- `/milestone M1` … `/milestone M5` — implement + validate the next milestone.
- Change the spec → bump `spec/VERSION`, add a `spec/CHANGELOG.md` entry, commit → `/spec-sync`.

## Prerequisites (macOS developer machine, AR-012)
- **Node 22 via nvm:** `nvm install` (reads `.nvmrc`), then `nvm use`.
- **Yarn 4 via Corepack:** `corepack enable` once per Node install. The exact Yarn version is pinned by the
  `packageManager` field in `package.json`.
- **Rust via Homebrew rustup:** `brew install rustup`, `rustup default stable`; put `/opt/homebrew/opt/rustup/bin`
  and `~/.cargo/bin` on `PATH`. `src-tauri/rust-toolchain.toml` pins the `stable` channel and the targets
  `aarch64-apple-darwin`, `x86_64-apple-darwin`, `x86_64-pc-windows-msvc` (rustup installs them on first use).
- **Xcode Command Line Tools:** `xcode-select --install`.
- **Windows cross-build (`yarn build:win-cross`):** `brew install nsis llvm lld`, `cargo install --locked cargo-xwin`,
  `rustup target add x86_64-pc-windows-msvc`, and `$(brew --prefix llvm)/bin` on `PATH`.
- **Windows (end users):** Microsoft Edge WebView2 runtime (preinstalled on Windows 10/11).

Check everything with `yarn check:env`.

## Setup
```sh
nvm use
corepack enable
yarn install --immutable
yarn playwright install chromium   # browser for the E2E tests
```

## Commands
| Command | What it does |
|---|---|
| `yarn dev` | Run the desktop app (Tauri) in development mode |
| `yarn dev:web` | Run the UI in a browser (in-memory database, no Tauri) |
| `yarn test` | Typecheck + lint + unit + integration + E2E tests |
| `yarn test:unit` / `yarn test:integration` / `yarn test:e2e` | Individual test levels |
| `yarn smoke:mac` | Build the macOS app and check it starts and creates its database |
| `yarn build:win-cross` | Cross-compile the Windows NSIS installer on macOS |
| `yarn verify` | `test` + `smoke:mac` + `build:win-cross` — run before every push |
| `yarn build` | Build the installer for the current OS (NSIS `.exe` on Windows) |
| `yarn spec:trace M1` | Check that every automated test case of a milestone has a test |
| `yarn check:env` | Verify the prerequisites above |

## Data location
The SQLite database `tracker.db` and the `documents/` folder live in the OS app-data directory
(`%APPDATA%\com.archtracker.app\` on Windows). Set `ARCHTRACKER_DATA_DIR` to use a different folder.
