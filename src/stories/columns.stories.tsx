import TableWright from '@components/table-wright';
import type { GridColumnGroupingModel } from '@mui/x-data-grid';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { baseMeta, type StoryArgs } from './meta';

const columnGroupingModel: GridColumnGroupingModel = [
  {
    groupId: 'identity',
    headerName: 'Identity',
    children: [
      {
        groupId: 'name',
        headerName: 'Name',
        children: [{ field: 'firstName' }, { field: 'lastName' }, { field: 'fullName' }],
      },
      { field: 'age' },
    ],
  },
  {
    groupId: 'employment',
    headerName: 'Employment',
    children: [
      { field: 'department' },
      { field: 'joined' },
      { field: 'salary' },
      { field: 'active' },
    ],
  },
];

const meta = {
  ...baseMeta,
  title: 'TableWright/Columns',
  component: TableWright,
} satisfies Meta<StoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const ColumnGrouping: Story = {
  args: { columnGroupingModel, showColumnVerticalBorder: true },
};

export const HiddenColumns: Story = {
  args: {
    showToolbar: true,
    initialState: {
      pagination: { paginationModel: { pageSize: 10, page: 0 } },
      columns: { columnVisibilityModel: { id: false, firstName: false, lastName: false } },
    },
  },
};

export const LockedDown: Story = {
  name: 'Locked down (no menu, sort, filter, resize)',
  args: {
    disableColumnMenu: true,
    disableColumnSorting: true,
    disableColumnFilter: true,
    disableColumnResize: true,
  },
};
