import useDetailPanel from '@hooks/use-detail-panel';
import { GRID_DETAIL_PANEL_TOGGLE_COL_DEF } from '@lib/detail-panel';
import { Box, Button, Stack, Typography } from '@mui/material';
import type {
  GridColDef,
  GridColumnGroupingModel,
  GridLoadingOverlayVariant,
  GridRowParams,
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

// Master-detail fixtures. Module-level functions keep a stable identity, which is what the grid
// uses to cache panel content and heights (inside a component, wrap them in useCallback).

type Project = { id: number; name: string; role: string; hours: number };

const projectNames = ['Compiler', 'Kernel', 'Scheduler', 'Parser', 'Router', 'Indexer'];

const makeProjects = (person: Person): Project[] =>
  Array.from({ length: (person.id % 4) + 1 }, (_, index) => ({
    id: index + 1,
    name: projectNames[(person.id + index) % projectNames.length]!,
    role: index === 0 ? 'Lead' : 'Contributor',
    hours: 40 + ((person.id * 13 + index * 29) % 120),
  }));

const projectColumns: GridColDef<Project>[] = [
  { field: 'name', headerName: 'Project', flex: 1 },
  { field: 'role', headerName: 'Role', width: 130 },
  { field: 'hours', headerName: 'Hours', type: 'number', width: 100 },
];

const PersonSummary = ({ row }: { row: Person }) => (
  <Stack spacing={0.5} sx={{ p: 2 }}>
    <Typography variant="subtitle1">
      {row.firstName} {row.lastName}
    </Typography>
    <Typography variant="body2" color="text.secondary">
      {row.department} · joined {row.joined.getFullYear()} · {currency.format(row.salary)}
    </Typography>
  </Stack>
);

const renderSummary = ({ row }: GridRowParams<Person>) => <PersonSummary row={row} />;

const renderProjects = ({ row }: GridRowParams<Person>) => (
  <Box sx={{ p: 2 }}>
    <Typography variant="subtitle2" gutterBottom>
      Projects of {row.firstName} {row.lastName}
    </Typography>
    <TableWright
      rows={makeProjects(row)}
      columns={projectColumns}
      density="compact"
      autoHeight
      hideFooter
      disableColumnMenu
    />
  </Box>
);

const autoHeight = () => 'auto' as const;

// Only active people have something to show; the rest get a disabled toggle.
const renderActiveOnly = (params: GridRowParams<Person>) =>
  params.row.active ? renderSummary(params) : null;

const ExpandAllHeader = () => {
  const { expandedRowIds, setExpandedDetailPanels } = useDetailPanel();
  const anyExpanded = expandedRowIds.size > 0;
  return (
    <Button
      size="small"
      onClick={() => setExpandedDetailPanels(new Set(anyExpanded ? [] : rows.map((row) => row.id)))}
    >
      {anyExpanded ? 'Collapse all' : 'Expand all'}
    </Button>
  );
};

const columnsWithTrailingToggle: GridColDef<Person>[] = [
  ...columns,
  { ...GRID_DETAIL_PANEL_TOGGLE_COL_DEF, width: 120, renderHeader: () => <ExpandAllHeader /> },
];

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

// Master-detail

export const MasterDetail: Story = {
  name: 'Master-detail (nested grid)',
  args: {
    getDetailPanelContent: renderProjects,
    getDetailPanelHeight: autoHeight,
    initialState: {
      pagination: { paginationModel: { pageSize: 10, page: 0 } },
      detailPanel: { expandedRowIds: new Set([2]) },
    },
  },
};

export const MasterDetailFixedHeight: Story = {
  name: 'Master-detail (fixed height)',
  args: {
    getDetailPanelContent: renderSummary,
    getDetailPanelHeight: () => 90,
  },
};

export const MasterDetailConditional: Story = {
  name: 'Master-detail (only some rows)',
  args: {
    getDetailPanelContent: renderActiveOnly,
    getDetailPanelHeight: autoHeight,
  },
};

export const MasterDetailCustomToggle: Story = {
  name: 'Master-detail (trailing toggle, expand all)',
  args: {
    columns: columnsWithTrailingToggle,
    getDetailPanelContent: renderSummary,
    getDetailPanelHeight: autoHeight,
  },
};
