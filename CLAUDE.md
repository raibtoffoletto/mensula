# tablewright — project conventions

Extension of `@mui/x-data-grid` (community) published as an ESM-only React component library. Global user conventions apply; this file notes project-specific additions and overrides.

## Stack

- **Package manager:** Yarn 1 (Classic). Lockfile is `yarn.lock`.
- **Build:** Vite 8 (Rolldown) library mode + `vite-plugin-dts` (`bundleTypes`). Use `build.rolldownOptions`, not the deprecated `rollupOptions`.
- **Types:** TypeScript 6, strict, `noUncheckedIndexedAccess` on. Not TS 7 yet: it drops the classic compiler API that `typescript-eslint`, `vite-plugin-dts` and `react-docgen-typescript` depend on. No `baseUrl` (removed in TS 7); `paths` are relative to `tsconfig.json`.
- **Lint/format:** ESLint 10 flat config (`defineConfig` from `eslint/config`) + Prettier. A11y rules come from `eslint-plugin-jsx-a11y-x` (maintained fork; the original `eslint-plugin-jsx-a11y` does not support ESLint 10). Rule prefix is `jsx-a11y-x/`. No `eslint-plugin-storybook` (legacy config incompatible with flat).
- **Tests:** Vitest + jsdom + React Testing Library. Setup at `src/test/setup.ts`.
- **Stories:** Storybook 10 with `@storybook/react-vite` (import story types from it, not `@storybook/react`). Save-from-Controls is off (`parameters.controls.disableSaveFromUI` in `.storybook/preview.tsx`) so the web UI never rewrites story files — keep it that way. Stories live in `src/stories/`, one `<feature>.stories.tsx` per feature (titled `TableWright/<Feature>`); shared fixtures are in `src/stories/data.ts` and shared meta (args, controls, render) in `src/stories/meta.tsx`. `src/stories` is excluded from the build and type bundle.

## Distribution

- **ESM-only.** No CJS build, no dual package. `type: "module"` and single `exports["."]` entry.
- **Peer-dep model.** `react`, `react-dom`, `@mui/material`, `@mui/system`, `@mui/x-data-grid`, `@emotion/react`, `@emotion/styled` are peers — never bundle them.
- `rolldownOptions.external` in `vite.config.ts` is derived from `peerDependencies` (subpaths included) — add a peer in `package.json` and it is externalized automatically.
- The published `dist/` is the only shipped artifact (see `files` in `package.json`).
- **MUI internals are quarantined.** Prefer public `@mui/x-data-grid` APIs. Where a Pro feature can only be rebuilt the way Pro does it (pipe processors, private `apiRef`, the virtualizer), import from `@mui/x-data-grid/internals` **only** in `src/components/pinning-sync.tsx` and `src/components/pinned-rows.tsx` (extend that list deliberately). `src/components/columns-management.tsx` may import the `vars` CSS-variable map from internals — nothing else — so the rebuilt columns panel matches the stock one. Because internals carry no semver guarantee, the `@mui/x-data-grid` peer range is pinned to the tested minor (`~9.14.0`); bump it only after `yarn test` and the Storybook stories pass on the new minor.

## Layout

Directory-per-role under `src/`:

```
src/components/   src/contexts/   src/hooks/   src/lib/   src/providers/   src/types/   src/stories/   src/test/
```

Path aliases: `@components/*`, `@contexts/*`, `@hooks/*`, `@lib/*`, `@providers/*`, `@types/*`. Declared in **both** `tsconfig.json` (`paths`) and `vite.config.ts` (`resolve.alias`) — keep them in sync.

## Component conventions

- **Files are kebab-case** (`table-wright.tsx`, `use-column-sync.ts`).
- **Default export** for each component; the public API is re-exported from `src/index.ts`.
- Each component ships with:
  - `<name>.tsx` — the component
  - `<name>.test.tsx` — vitest + RTL
- Each user-facing feature gets a `src/stories/<feature>.stories.tsx` (Storybook CSF3).

## Testing

- `yarn test` runs once; `yarn test:watch` for development; `yarn test:coverage` adds a v8 coverage report (text + `coverage/index.html`).
- Tests must render through RTL (`@testing-library/react`) — no shallow rendering.
- `@testing-library/jest-dom/vitest` matchers are globally available via the setup file.

## Scripts (what to run when)

| Intent               | Command                                    |
| -------------------- | ------------------------------------------ |
| Visual dev loop      | `yarn storybook`                           |
| Fast feedback        | `yarn test:watch`                          |
| Pre-commit check     | `yarn lint && yarn typecheck && yarn test` |
| Publishable artifact | `yarn build`                               |

## Things not to do

- Do not add a CJS build or `require` entry.
- Do not import MUI or React packages without them being peers.
- Do not colocate `createContext` / Provider / `use*` — split into `contexts/`, `providers/`, `hooks/` per global conventions (if/when contexts are introduced here).
- Do not use TypeScript `enum`; use `as const satisfies Record<string, Union>` with an ambient union type under `src/types/`.
