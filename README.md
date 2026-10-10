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

## Toolbar

`showToolbar` renders `TableWrightToolbar`: an always-open search field, the grid `label`, and text buttons for filters, columns and CSV export. Below the theme's `md` breakpoint the toolbar goes compact: the search collapses behind a search button (expanding on click, or while it holds a value) and the buttons become icon buttons with their labels as tooltips. Printing is not offered. Configure it through `slotProps.toolbar` with the grid's usual toolbar options (`showQuickFilter`, `quickFilterProps`, `csvOptions`).

### Building your own

Give `TableWrightToolbar` children and they replace the default layout. Hand the result to the grid as the `toolbar` slot:

```tsx
import {
  TableWright,
  TableWrightToolbar,
  ToolbarExportCsv,
  ToolbarGroup,
  ToolbarLabel,
  ToolbarSearch,
} from 'tablewright';
import Button from '@mui/material/Button';

const MyToolbar = () => (
  <TableWrightToolbar>
    <ToolbarSearch debounceMs={500} />
    <ToolbarLabel />
    <ToolbarGroup>
      <ToolbarExportCsv options={{ fileName: 'pioneers' }} />
      <Button>Add pioneer</Button>
    </ToolbarGroup>
  </TableWrightToolbar>
);

<TableWright rows={rows} columns={columns} showToolbar slots={{ toolbar: MyToolbar }} />;
```

| Drop-in                | Renders                                            | Props                                                           | Hidden when                         |
| ---------------------- | -------------------------------------------------- | --------------------------------------------------------------- | ----------------------------------- |
| `ToolbarSearch`        | Always-open quick filter, with a clear button      | Same as `quickFilterProps` (parser, formatter, debounce, field) | —                                   |
| `ToolbarLabel`         | The grid's `label`, or its children in its place   | `children`                                                      | —                                   |
| `ToolbarGroup`         | A flex row to keep items together                  | Any `<div>` prop, `sx`                                          | —                                   |
| `ToolbarFiltersButton` | Opens the filter panel; a dot marks active filters | —                                                               | `disableColumnFilter` on the grid   |
| `ToolbarColumnsButton` | Opens the columns panel                            | —                                                               | `disableColumnSelector` on the grid |
| `ToolbarExportCsv`     | Downloads a CSV in one click                       | `options` (same as `csvOptions`)                                | `options.disableToolbarButton`      |

Children skip the default layout, so `showQuickFilter`, `quickFilterProps` and `csvOptions` from `slotProps.toolbar` no longer apply. Pass those options to the drop-ins instead. Any other element can sit next to the drop-ins.

### Styling the toolbar

`sx`, `className`, `style` and other `<div>` attributes reach the toolbar root in both modes. `sx` layers over the default `justifyContent: 'space-between'` and muted text color, and takes the object, function or array form.

```tsx
// Default layout
<TableWright showToolbar slotProps={{ toolbar: { sx: { px: 2, bgcolor: 'grey.100' } } }} />

// Your own layout
<TableWrightToolbar sx={{ justifyContent: 'flex-start', gap: 2 }}>…</TableWrightToolbar>
```

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
