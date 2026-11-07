// Spec: AR-002, AR-006, AR-008
import js from "@eslint/js";
import boundaries from "eslint-plugin-boundaries";
import tseslint from "typescript-eslint";

const CORE = ["core-domain", "core-ports", "core-usecases"];
const elementsOf = (types) => types.map((type) => ({ element: { type } }));
// Third-party packages and Node/platform built-ins; never allowed from src/core (AR-002).
const modules = { to: { module: { origin: ["external", "core"] } } };
const toElements = (types) => types.map((type) => ({ to: { element: { type } } }));

export default tseslint.config(
  {
    ignores: ["node_modules/**", "dist/**", "dist-e2e/**", "src-tauri/**", "playwright-report/**", "test-results/**"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { boundaries },
    settings: {
      "import/resolver": { node: { extensions: [".ts", ".tsx", ".js", ".json"] } },
      "boundaries/elements": [
        { type: "core-domain", pattern: "src/core/domain/**", partialMatch: false },
        { type: "core-ports", pattern: "src/core/ports/**", partialMatch: false },
        { type: "core-usecases", pattern: "src/core/usecases/**", partialMatch: false },
        { type: "core-other", pattern: "src/core/**", partialMatch: false },
        { type: "adapters", pattern: "src/adapters/**", partialMatch: false },
        { type: "app", pattern: "src/app/**", partialMatch: false },
        { type: "ui", pattern: "src/ui/**", partialMatch: false },
        { type: "main", pattern: "src", partialMatch: false },
      ],
    },
    rules: {
      // AR-002: src/core imports only src/core; adapters never import ui; ui never imports adapters and
      // uses src/core/domain for types only; src/app is the only place wiring adapters to use cases.
      "boundaries/dependencies": [
        "error",
        {
          default: "disallow",
          checkAllOrigins: true,
          policies: [
            {
              from: elementsOf([...CORE, "core-other"]),
              allow: toElements([...CORE, "core-other"]),
            },
            {
              from: elementsOf(["adapters"]),
              allow: [...toElements(["core-domain", "core-ports", "adapters"]), modules],
            },
            {
              from: elementsOf(["app"]),
              allow: [...toElements([...CORE, "adapters", "app"]), modules],
            },
            {
              from: elementsOf(["ui"]),
              allow: [...toElements(["core-usecases", "app", "ui"]), modules],
            },
            {
              from: elementsOf(["ui"]),
              allow: { to: { element: { type: "core-domain" } }, dependency: { kind: "type" } },
            },
            {
              from: elementsOf(["main"]),
              allow: [...toElements(["app", "ui"]), modules],
            },
          ],
        },
      ],
    },
  },
);
