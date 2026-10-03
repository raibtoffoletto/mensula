import TableWright from '@components/table-wright';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { baseMeta, type StoryArgs } from './meta';

const meta = {
  ...baseMeta,
  title: 'TableWright/Sorting & filtering',
  component: TableWright,
} satisfies Meta<StoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const SortedAndFiltered: Story = {
  args: {
    showToolbar: true,
    initialState: {
      pagination: { paginationModel: { pageSize: 10, page: 0 } },
      sorting: { sortModel: [{ field: 'age', sort: 'desc' }] },
      filter: {
        filterModel: { items: [{ field: 'department', operator: 'is', value: 'Engineering' }] },
      },
    },
  },
};

export const NoFilterResults: Story = {
  args: {
    initialState: {
      filter: {
        filterModel: { items: [{ field: 'lastName', operator: 'equals', value: 'Nobody' }] },
      },
    },
  },
};
