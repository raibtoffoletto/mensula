import Mensula from '@components/mensula';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { baseMeta, type StoryArgs } from './meta';
import { makeRows } from './data';

const meta = {
  ...baseMeta,
  title: 'Mensula/Rows',
  component: Mensula,
} satisfies Meta<StoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const RowSpanning: Story = {
  args: {
    rowSpanning: true,
    showCellVerticalBorder: true,
    showColumnVerticalBorder: true,
  },
};

export const LargeDataset: Story = {
  name: 'Large dataset (10k rows, virtualized)',
  args: {
    rows: makeRows(10_000),
    initialState: {
      pagination: { paginationModel: { pageSize: 100, page: 0 } },
    },
    pageSizeOptions: [25, 50, 100],
  },
};
