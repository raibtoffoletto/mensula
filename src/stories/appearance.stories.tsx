import Mensula from '@components/mensula';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { baseMeta, type StoryArgs } from './meta';
import { makeRows } from './data';

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
