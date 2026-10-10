import Mensula from '@components/mensula';
import useDetailPanel from '@hooks/use-detail-panel';
import { GRID_DETAIL_PANEL_TOGGLE_COL_DEF } from '@lib/detail-panel';
import { Box, Button, Stack, Typography } from '@mui/material';
import type { GridColDef, GridRowParams } from '@mui/x-data-grid';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { columns, currency, rows, type Person } from './data';
import { baseMeta, type StoryArgs } from './meta';

// Module-level functions keep a stable identity, which is what the grid uses to cache panel
// content and heights (inside a component, wrap them in useCallback).

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
    <Mensula
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

const meta = {
  ...baseMeta,
  title: 'Mensula/Master detail',
  component: Mensula,
} satisfies Meta<StoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const NestedGrid: Story = {
  name: 'Nested grid (auto height)',
  args: {
    getDetailPanelContent: renderProjects,
    getDetailPanelHeight: autoHeight,
    initialState: {
      pagination: { paginationModel: { pageSize: 10, page: 0 } },
      detailPanel: { expandedRowIds: new Set([2]) },
    },
  },
};

export const FixedHeight: Story = {
  args: {
    getDetailPanelContent: renderSummary,
    getDetailPanelHeight: () => 90,
  },
};

export const OnlySomeRows: Story = {
  name: 'Only some rows',
  args: {
    getDetailPanelContent: renderActiveOnly,
    getDetailPanelHeight: autoHeight,
  },
};

export const CustomToggle: Story = {
  name: 'Trailing toggle with expand all',
  args: {
    columns: columnsWithTrailingToggle,
    getDetailPanelContent: renderSummary,
    getDetailPanelHeight: autoHeight,
  },
};
