import Mensula from '@components/mensula';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { columns, makeRows } from './data';
import { baseMeta, type StoryArgs } from './meta';

const meta = {
  ...baseMeta,
  title: 'Mensula/Appearance',
  component: Mensula,
} satisfies Meta<StoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

// Density

export const Compact: Story = {
  args: { density: 'compact' },
};

export const Comfortable: Story = {
  args: { density: 'comfortable' },
};

// View menu

/** Right-click the footer or the header row past the last column to pick density and borders. */
export const ViewMenu: Story = {
  args: { columns: columns.slice(0, 4) },
};

/** `disableDensitySelector` leaves only the border toggles in the view menu. */
export const ViewMenuWithoutDensity: Story = {
  args: { columns: columns.slice(0, 4), disableDensitySelector: true },
};

// Chrome

export const VerticalBorders: Story = {
  args: { showCellVerticalBorder: true, showColumnVerticalBorder: true },
};

export const StripedRows: Story = {
  args: {
    getRowClassName: ({ indexRelativeToCurrentPage }) =>
      indexRelativeToCurrentPage % 2 === 0 ? 'even' : 'odd',
    sx: { '& .odd': { bgcolor: 'action.hover' } },
  },
};

export const HiddenFooter: Story = {
  args: { hideFooter: true },
};

export const AutoHeight: Story = {
  args: {
    autoHeight: true,
    rows: makeRows(5),
    initialState: {},
    hideFooter: true,
  },
};
