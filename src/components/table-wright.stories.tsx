import { Box } from '@mui/material';
import type {
  GridColDef,
  GridColumnGroupingModel,
  GridLoadingOverlayVariant,
} from '@mui/x-data-grid';
import type { Meta, StoryObj } from '@storybook/react-vite';
import TableWright, { type TableWrightProps } from './table-wright';

type Person = {
  id: number;
  firstName: string;
  lastName: string;
  age: number;
  department: string;
  joined: Date;
  salary: number;
  active: boolean;
};

const people = [
  ['Ada', 'Lovelace', 36],
  ['Linus', 'Torvalds', 54],
  ['Grace', 'Hopper', 85],
  ['Dennis', 'Ritchie', 70],
  ['Alan', 'Turing', 41],
  ['Margaret', 'Hamilton', 88],
  ['Ken', 'Thompson', 82],
  ['Barbara', 'Liskov', 86],
  ['Edsger', 'Dijkstra', 72],
  ['Radia', 'Perlman', 73],
] as const;

const departments = ['Engineering', 'Research', 'Operations', 'Design'];

// Deterministic data so visual diffs stay stable. Departments come in runs of three rows,
// which gives the row-spanning story something to merge.
const makeRows = (count: number): Person[] =>
  Array.from({ length: count }, (_, index) => {
    const [firstName, lastName, age] = people[index % people.length]!;
    return {
      id: index + 1,
      firstName,
      lastName,
      age,
      department: departments[Math.floor(index / 3) % departments.length]!,
      joined: new Date(2000 + (index % 25), index % 12, (index % 28) + 1),
      salary: 60_000 + ((index * 7_919) % 90_000),
      active: index % 3 !== 0,
    };
  });

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const columns: GridColDef<Person>[] = [
  { field: 'id', headerName: 'ID', width: 70 },
  { field: 'firstName', headerName: 'First name', width: 130 },
  { field: 'lastName', headerName: 'Last name', width: 130 },
  {
    field: 'fullName',
    headerName: 'Full name',
    width: 170,
    sortable: false,
    valueGetter: (_value, row) => `${row.firstName} ${row.lastName}`,
  },
  { field: 'age', headerName: 'Age', type: 'number', width: 80 },
  {
    field: 'department',
    headerName: 'Department',
    type: 'singleSelect',
    valueOptions: departments,
    width: 140,
  },
  { field: 'joined', headerName: 'Joined', type: 'date', width: 120 },
  {
    field: 'salary',
    headerName: 'Salary',
    type: 'number',
    width: 120,
    valueFormatter: (value: number) => currency.format(value),
  },
  { field: 'active', headerName: 'Active', type: 'boolean', width: 90 },
];

const editableColumns = columns.map((column) =>
  column.field === 'id' || column.field === 'fullName' ? column : { ...column, editable: true },
);

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

const rows = makeRows(25);

type StoryArgs = TableWrightProps & {
  /** Story-only: overlay variant used while `loading` is true (with and without rows). */
  loadingVariant?: GridLoadingOverlayVariant;
};

const meta = {
  title: 'Components/TableWright',
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

export default meta;

type Story = StoryObj<typeof meta>;

/** Every visual prop is wired to Controls — combine them freely. */
export const Playground: Story = {};

// Density

export const Compact: Story = {
  args: { density: 'compact' },
};

export const Comfortable: Story = {
  args: { density: 'comfortable' },
};

// Chrome

export const WithToolbar: Story = {
  args: { showToolbar: true, label: 'Computing pioneers' },
};

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

export const ColumnGrouping: Story = {
  args: { columnGroupingModel, showColumnVerticalBorder: true },
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

export const LockedDown: Story = {
  name: 'Locked down (no menu, sort, filter, resize)',
  args: {
    disableColumnMenu: true,
    disableColumnSorting: true,
    disableColumnFilter: true,
    disableColumnResize: true,
  },
};

// Selection

export const CheckboxSelection: Story = {
  args: { checkboxSelection: true, disableRowSelectionOnClick: true },
};

export const PreselectedRows: Story = {
  args: {
    checkboxSelection: true,
    rowSelectionModel: { type: 'include', ids: new Set([2, 3, 5]) },
  },
};

// Data shaping

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

export const HiddenColumns: Story = {
  args: {
    showToolbar: true,
    initialState: {
      pagination: { paginationModel: { pageSize: 10, page: 0 } },
      columns: { columnVisibilityModel: { id: false, firstName: false, lastName: false } },
    },
  },
};

export const RowSpanning: Story = {
  args: {
    rowSpanning: true,
    showCellVerticalBorder: true,
    showColumnVerticalBorder: true,
  },
};

export const Editable: Story = {
  args: { columns: editableColumns },
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

// Overlays

export const Empty: Story = {
  args: { rows: [] },
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

export const LoadingSkeleton: Story = {
  args: { loading: true, loadingVariant: 'skeleton', rows: [] },
};

export const LoadingCircularProgress: Story = {
  args: { loading: true, loadingVariant: 'circular-progress', rows: [] },
};

export const LoadingLinearProgressOverRows: Story = {
  name: 'Loading linear progress (refetch over rows)',
  args: { loading: true, loadingVariant: 'linear-progress' },
};
