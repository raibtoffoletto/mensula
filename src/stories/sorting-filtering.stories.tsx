import Mensula from '@components/mensula';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { baseMeta, type StoryArgs } from './meta';

const meta = {
  ...baseMeta,
  title: 'Mensula/Sorting & filtering',
  component: Mensula,
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

/** Several filters at once, as in DataGridPro: open the filter panel and use "Add filter". */
export const MultipleFilters: Story = {
  args: {
    showToolbar: true,
    initialState: {
      pagination: { paginationModel: { pageSize: 10, page: 0 } },
      filter: {
        filterModel: {
          items: [
            { id: 1, field: 'department', operator: 'is', value: 'Engineering' },
            { id: 2, field: 'age', operator: '>', value: 50 },
          ],
        },
      },
    },
  },
};
