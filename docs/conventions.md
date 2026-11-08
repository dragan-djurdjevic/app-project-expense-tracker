# Code conventions (implementer quick reference)

How the existing code implements `spec/01-architecture.md`. This file describes patterns only; it adds no
behaviour. If it ever disagrees with `spec/`, the spec wins — fix this file.

**Reading rule:** read this file instead of exploring `src/` and `tests/`. Open an existing file only when you must
edit it, or when a pattern below is not enough — then open the one exemplar listed for that layer, and use
`grep -n` + a line range for files over ~200 lines.

The reference entity is **Contract** (M3). Everything below is copied from its files.

## Layout per entity `<E>` (e.g. `Invoice`)

| Layer | File | Exemplar |
|---|---|---|
| Domain types, input validation, error factories | `src/core/domain/<E>.ts` | `src/core/domain/Contract.ts` |
| Port | `src/core/ports/<E>Repository.ts` | `src/core/ports/ContractRepository.ts` |
| Use cases (one per file) | `src/core/usecases/<e>/<verb><E>.ts` | `src/core/usecases/contract/*` |
| SQLite adapter | `src/adapters/sqlite/Sqlite<E>Repository.ts` | `src/adapters/sqlite/SqliteContractRepository.ts` |
| Wiring | `src/app/composition.ts` (+ `Container.ts` types) | — |
| Screens | `src/ui/screens/<E>s/{<E>sScreen,<E>List,<E>Form}.tsx` | `src/ui/screens/Contracts/*` |
| Texts | `src/ui/i18n/en.json` | — |
| Unit tests (in-memory repos) | `tests/unit/usecases/<e>.test.ts` | `tests/unit/usecases/contract.test.ts` |
| Integration tests (real SQLite) | `tests/integration/<e>.test.ts` | `tests/integration/contract.test.ts` |
| E2E | `tests/e2e/<e>s.spec.ts` | `tests/e2e/contracts.spec.ts` |
| Fixture `"basic"` | `tests/fixtures/basic.ts` (IDs in `BASIC`), seeded via `src/app/e2eFixtures.ts` | — |

Shared building blocks (reuse, don't re-create):
- Domain: `Result` (`ok`/`err`), `DomainError` (`domainError`, `requiredError`, `formatError`, `moneyError`),
  `Money` (`createMoney`), `DateOnly` (`createDateOnly`), `Text` (`requiredText`, `optionalText`),
  `Archive` (`isArchived`, `archivedReadOnlyError`, `parentArchivedError`), `Entity`, `VatRate`, `StoredDocumentRef`.
- Ports: `EntityRepository<T, Fields, Filter>`, `BaseListFilter` (`search`, `includeArchived`), `Clock`,
  `IdGenerator`, `DocumentStorage`.
- Adapters: `SqlDriver` (`select<Row>`, `execute`), `searchCondition(columns, search)`, `runInTransaction`.
- UI components: `DataTable`, `ListToolbar`, `RowActions`, `FormDrawer`, `useEntityForm`, `useAsyncList`,
  `ConfirmArchiveDialog`, `StatusBadge`, `ScreenTitle`; formatters in `src/ui/format/` (`formatMoney`,
  `parseMoney`, `formatDate`, `dateToIso`, `isoToDate`, `parseDisplayDate`, `formatPercent`, `formatVatPercent`, `parseVatPercent`).
- Tests: `setupServices()` + `value()` (`tests/fixtures/services.ts`), `controlledClock`, `sequentialIds`,
  e2e helpers `openScreen`, `drawer`, `pick`, `rows`, `rowByText`, `rowAction`, `archiveRow`, `toggleArchived`.

## Every file
- First line: `// Spec: <ID>, <ID>, …` (SQL: `-- Spec: …`). Named exports only; default export only for React
  screen components. No `any`. Imports use `import type` for types.
- Short JSDoc on exported functions/fields that cite the rule they implement (e.g. `/** BR-CON-004: … */`).
  No other comments.

## Domain file (`Contract.ts` pattern)
```ts
export const <E>_STATUSES = ["A", "B"] as const;
export type <E>Status = (typeof <E>_STATUSES)[number];
export interface <E>Fields { /* persisted fields, typed with Money / DateOnly / string | null */ }
export interface <E> extends Entity, <E>Fields {}
export interface <E>ListItem extends <E> { /* joined/computed list columns */ }
export interface <E>Input { /* raw form input: strings, number | null, optional nullable */ }

/** BR-XXX-00n: <what>. */
export const fooError = (): DomainError => domainError("BR-XXX-00n", "errors.<e>.foo", "<field>");

/** Field rules in form field order (AR-005 step 1); references and uniqueness are checked by use cases. */
export function validate<E>Input(input: <E>Input): Result<<E>Fields> {
  const number = requiredText(input.number, 50, "number");
  if (!number.ok) return number;          // stop at first failure
  // …
  return ok({ … });
}
```

## Port
```ts
export interface <E>ListFilter extends BaseListFilter { projectId?: string; /* … */ }
export interface <E>Repository extends Omit<EntityRepository<<E>, <E>Fields, <E>ListFilter>, "list"> {
  list(filter: <E>ListFilter): Promise<<E>ListItem[]>;
  existsByNumber(parentId: string, number: string, excludeId?: string): Promise<boolean>;
}
```

## Use cases
```ts
export type Create<E> = (input: <E>Input) => Promise<Result<<E>>>;

export function makeCreate<E>({ <e>Repo, parentRepo, clock, ids }: { <e>Repo: <E>Repository; … }): Create<E> {
  return async (input) => {
    const fields = validate<E>Input(input);              // (1) field rules
    if (!fields.ok) return fields;
    const refError = await checkParentReference(…);      // (2) references (exists, active per BR-GEN-006)
    if (refError) return err(refError);
    if (await <e>Repo.existsByNumber(…)) return err(numberDuplicateError()); // (3) uniqueness
    const now = clock.now().toISOString();
    return ok(await <e>Repo.create({ id: ids.next(), ...fields.value, createdAt: now, updatedAt: now, archivedAt: null }));
  };
}
```
- `update`: `get` → unknown id `throw new Error(\`<E> not found: ${id}\`)` → `isArchived` → `err(archivedReadOnlyError())`
  → immutability checks → (1)–(3) → `repo.update(id, { ...fields.value, updatedAt })`. A reference is re-checked
  only when it changes.
- `archive`/`restore`: unknown id throws; already archived/active is a no-op `ok(undefined)`.
- `get`: returns `ok(null)` for unknown id. `list`: `async (filter = {}) => ok(await repo.list(filter))`.
- Shared reference checks live in `src/core/usecases/<e>/check<E>References.ts`.
- Constants the UI needs (options, defaults) are exported from the use case file (e.g. `CONTRACT_TYPE_OPTIONS`).

## SQLite adapter
- `interface <E>Row` with `snake_case` columns; `const COLUMNS = "id, …, archived_at"`; `to<E>(row)` maps to
  camelCase. Mapping happens only here.
- `constructor(private readonly db: SqlDriver, private readonly clock: Clock) {}`.
- `list`: build `where: string[]` + `params: SqlValue[]`; `archived_at IS NULL` unless `includeArchived`;
  `searchCondition([...cols], filter.search)`; sums via `COALESCE((SELECT SUM(…)), 0)`; order
  `date DESC, number COLLATE NOCASE, id`.
- `update` writes only mutable columns, then re-reads via `get` (throw if missing).
- `archive`/`restore` set `archived_at` and `updated_at` from `clock`.
- `existsByNumber`: `COUNT(*) … number = ? COLLATE NOCASE AND id <> ?` with `excludeId ?? ""`, includes archived.
- Schema changes: new numbered file in `src/adapters/sqlite/migrations/` + register in `bundledMigrations.ts`.

## Composition
- Instantiate `new Sqlite<E>Repository(db, clock)` next to the others; add each use case to `useCases` as
  `<verb><E>: make<Verb><E>({ … })`, grouped per entity, in list/get/create/update/archive/restore order.
- Add the use case types to `Container.ts`.

## UI
- Screen = `ScreenTitle` + `<E>List`. List component takes optional `projectId` (project-detail tab mode, fixed
  project, no project filter) and `onChanged`; state via `useState`, data via `useAsyncList(() => useCases.list…(…), deps)`
  with a `refresh` counter. Filters use the sentinel `const ALL = "all"`.
- Form = `FormDrawer` + `useEntityForm`; props `{ opened, <e>: <E>ListItem | null, preset…, onClose, onDone }`;
  local `Values` interface with string/Date form values, converted with `parseMoney`/`dateToIso` on save; read-only
  with Restore when archived.
- Only use cases via `useApp().useCases`; never import adapters. All text via `t("…")`; `data-testid`s exactly
  as `spec/04-ui.md` (`btn-new`, `btn-save`, `field-<name>`, `filter-<name>`, `row-<id>`, `error-<field>`, …).

## i18n (`en.json`)
- Groups: `common`, `nav`, `entity.<e>.*` (labels), `enum.<name>.*`, `errors.*` (`errors.<e>.<rule>` for entity
  rules). Add keys under the existing group; don't reorder existing keys.

## Tests
- Title starts with the TC ID: `it("TC-M3-004 OUTGOING contract with archived subcontractor returns BR-GEN-006", …)`.
- Unit: build use cases with in-memory repos (`tests/unit/usecases/InMemory*Repositories.ts`), `controlledClock`,
  `sequentialIds`; fixed UUID constants like `"30000000-0000-4000-8000-000000000001"`.
- Integration: `const s = await setupServices()`; a local `withParents()` builder returning parents plus input
  factories (`incoming(overrides)`); assert whole results with `toEqual({ ok: false, error: { code, messageKey, field } })`
  and verify persistence with `s.db.select(...)`.
- E2E: `await openScreen(page, "nav-<screen>", "basic")`, rows by `row-${BASIC.<e>s.<key>}`, drawers by title,
  assert visible texts exactly as rendered (formatted money/dates).
- Expected values come verbatim from the spec TC tables.
