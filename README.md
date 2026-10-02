# tablewright

An opinionated extension of [MUI X Data Grid (Community)](https://mui.com/x/react-data-grid/) — the free tier — packaged as a reusable React component library.

> Status: early scaffold. The initial `TableWright` is a passthrough over `DataGrid` while the API surface takes shape.

## Install

```sh
yarn add tablewright
```

### Peer dependencies

You must install these yourself:

```sh
yarn add react react-dom @mui/material @mui/x-data-grid @emotion/react @emotion/styled
```

| Peer               | Range                  |
| ------------------ | ---------------------- |
| `react`            | `^18.0.0 \|\| ^19.0.0` |
| `react-dom`        | `^18.0.0 \|\| ^19.0.0` |
| `@mui/material`    | `^9.0.0`               |
| `@mui/x-data-grid` | `^9.0.0`               |
| `@emotion/react`   | `^11.13.0`             |
| `@emotion/styled`  | `^11.13.0`             |

## Usage

```tsx
import { TableWright } from 'tablewright';

const columns = [
  { field: 'id', headerName: 'ID', width: 90 },
  { field: 'name', headerName: 'Name', width: 150 },
];

const rows = [
  { id: 1, name: 'Ada' },
  { id: 2, name: 'Linus' },
];

export default function Example() {
  return (
    <div style={{ height: 400, width: '100%' }}>
      <TableWright rows={rows} columns={columns} />
    </div>
  );
}
```

Props extend `DataGridProps` from `@mui/x-data-grid` — anything the community `DataGrid` accepts is accepted here.

## Development

Node 22+ and Yarn 1 (Classic).

```sh
yarn install
yarn storybook       # dev with live stories (http://localhost:6006)
yarn test            # vitest run
yarn test:watch      # vitest watch
yarn lint            # eslint flat config
yarn format          # prettier write
yarn typecheck       # tsc --noEmit
yarn build           # emits dist/ (ESM + .d.ts)
yarn build-storybook # static storybook export
```

## Project layout

```
src/
  components/   # components (default export, kebab-case files)
  hooks/        # React hooks
  lib/          # framework-agnostic helpers
  types/        # ambient .d.ts (no export/import)
  test/         # vitest setup
  index.ts      # public entry
.storybook/     # storybook config
```

Path aliases: `@components/*`, `@hooks/*`, `@lib/*`, `@types/*` (declared in both `tsconfig.json` and `vite.config.ts`).

## Publishing

ESM-only. The package exports a single entry (`.`) that resolves to `dist/index.js` with types at `dist/index.d.ts`. CJS is intentionally not supported.

```sh
yarn build        # runs typecheck then vite build
npm publish       # prepublishOnly re-runs yarn build
```

## License

MIT
