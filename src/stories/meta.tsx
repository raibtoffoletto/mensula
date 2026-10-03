import TableWright, { type TableWrightProps } from '@components/table-wright';
import { Box } from '@mui/material';
import type { GridLoadingOverlayVariant } from '@mui/x-data-grid';
import type { Decorator, Meta } from '@storybook/react-vite';
import { columns, rows } from './data';

export type StoryArgs = TableWrightProps & {
  /** Story-only: overlay variant used while `loading` is true (with and without rows). */
  loadingVariant?: GridLoadingOverlayVariant;
};

/** Narrower than the columns, so there is something to scroll past pinned columns. */
export const narrow: Decorator = (Story) => (
  <Box sx={{ maxWidth: 720 }}>
    <Story />
  </Box>
);

/**
 * Defaults shared by every feature file. Each file spreads this and adds its own `title`
 * (and repeats `component`, which Storybook's indexer only picks up when written inline).
 */
export const baseMeta = {
  component: TableWright,
  args: {
    rows,
    columns,
    initialState: {
      pagination: { paginationModel: { pageSize: 10, page: 0 } },
    },
    pageSizeOptions: [5, 10, 25],
    density: 'standard',
    loading: false,
    loadingVariant: 'linear-progress',
    checkboxSelection: false,
    showToolbar: false,
    showCellVerticalBorder: false,
    showColumnVerticalBorder: false,
    hideFooter: false,
    disableColumnMenu: false,
    disableColumnSorting: false,
    disableColumnFilter: false,
    disableColumnResize: false,
    disableRowSelectionOnClick: false,
    rowSpanning: false,
  },
  argTypes: {
    density: {
      control: 'inline-radio',
      options: ['compact', 'standard', 'comfortable'],
    },
    loadingVariant: {
      control: 'inline-radio',
      options: ['skeleton', 'linear-progress', 'circular-progress'],
      if: { arg: 'loading' },
    },
  },
  parameters: {
    controls: {
      // DataGrid exposes ~200 props; surface only the ones that change how the table looks.
      include: [
        'density',
        'loading',
        'loadingVariant',
        'checkboxSelection',
        'showToolbar',
        'label',
        'showCellVerticalBorder',
        'showColumnVerticalBorder',
        'hideFooter',
        'disableColumnMenu',
        'disableColumnSorting',
        'disableColumnFilter',
        'disableColumnResize',
        'disableRowSelectionOnClick',
        'rowSpanning',
        'autoHeight',
      ],
    },
  },
  render: ({ loadingVariant, slotProps, ...args }) => (
    <Box sx={{ height: args.autoHeight ? 'auto' : 520, width: '100%' }}>
      <TableWright
        {...args}
        slotProps={{
          ...slotProps,
          loadingOverlay: {
            variant: loadingVariant,
            noRowsVariant: loadingVariant,
            ...slotProps?.loadingOverlay,
          },
        }}
      />
    </Box>
  ),
} satisfies Meta<StoryArgs>;
