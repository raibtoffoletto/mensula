import Mensula from '@components/mensula';
import type { PinnedRowsProp } from '@contexts/pinning';
import { Box, Typography } from '@mui/material';
import type { GridRowId } from '@mui/x-data-grid';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { rows, type Person } from './data';
import { baseMeta, narrow, type StoryArgs } from './meta';

const meta = {
  ...baseMeta,
  title: 'Mensula/Row menu',
  component: Mensula,
  args: {
    ...baseMeta.args,
    showRowMenu: true,
    initialState: {
      ...baseMeta.args.initialState,
      highlightedRowIds: new Set<GridRowId>([3]),
    },
  },
} satisfies Meta<StoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Open a row's menu to pin it to the top or bottom, or to highlight it. Shift + click on a row
 * also toggles its highlight. Right-click a row for the same menu at the pointer, or a column
 * header for its column menu.
 */
export const Default: Story = {};

/** The menu column sits after the checkbox column; opening it never selects the row. */
export const WithSelection: Story = {
  args: { checkboxSelection: true },
};

/** Highlighted rows keep their tint across pinned columns. */
export const WithPinnedColumns: Story = {
  args: {
    initialState: {
      ...meta.args.initialState,
      pinnedColumns: { left: ['fullName'], right: ['salary'] },
    },
  },
  decorators: [narrow],
};

/** Recolor highlights by overriding `--Mensula-highlightColor` through `sx`. */
export const CustomHighlightColor: Story = {
  args: {
    sx: { '--Mensula-highlightColor': (theme) => theme.palette.info.main },
    initialState: {
      ...meta.args.initialState,
      highlightedRowIds: new Set<GridRowId>([2, 3, 5]),
    },
  },
};

const Controlled = (args: StoryArgs) => {
  const [pinnedRows, setPinnedRows] = useState<PinnedRowsProp<Person>>({ top: [rows[0]!] });
  const [highlightedRowIds, setHighlightedRowIds] = useState(() => new Set<GridRowId>([4]));
  const ids = (list: Person[] | undefined) => list?.map((row) => row.id).join(', ') || 'none';

  return (
    <Box sx={{ display: 'grid', gap: 1 }}>
      <Typography variant="body2">
        Top: {ids(pinnedRows.top)} · Bottom: {ids(pinnedRows.bottom)} · Highlighted:{' '}
        {[...highlightedRowIds].join(', ') || 'none'}
      </Typography>
      <Box sx={{ height: 520 }}>
        <Mensula
          {...args}
          pinnedRows={pinnedRows}
          onPinnedRowsChange={setPinnedRows}
          highlightedRowIds={highlightedRowIds}
          onHighlightedRowIdsChange={setHighlightedRowIds}
        />
      </Box>
    </Box>
  );
};

/**
 * Right-clicking still opens the row menu without the menu column; `disableContextMenu` gives
 * right-clicks back to the browser.
 */
export const ContextMenuOnly: Story = {
  args: { showRowMenu: false },
};

/** `pinnedRows` and `highlightedRowIds` controlled by the parent, which shows them above. */
export const ControlledState: Story = {
  render: ({ loadingVariant: _loadingVariant, ...args }) => <Controlled {...args} />,
};
