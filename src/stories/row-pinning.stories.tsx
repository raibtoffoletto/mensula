import TableWright from '@components/table-wright';
import type { PinnedRowsProp } from '@contexts/pinning';
import { Box } from '@mui/material';
import {
  GridActionsCellItem,
  type GridColDef,
  type GridRowId,
  type GridRowParams,
} from '@mui/x-data-grid';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useMemo, useState } from 'react';
import { columns, rows, type Person } from './data';
import { baseMeta, narrow, type StoryArgs } from './meta';

// Summary rows share the Person shape so every column can render them. Negative ids keep them
// clear of the data rows' ids.
const summaryRow = (id: number, label: string, pick: (values: number[]) => number): Person => ({
  id,
  firstName: label,
  lastName: '',
  age: Math.round(pick(rows.map((row) => row.age))),
  department: '',
  joined: new Date(Math.max(...rows.map((row) => row.joined.getTime()))),
  salary: Math.round(pick(rows.map((row) => row.salary))),
  active: rows.every((row) => row.active),
});

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);

const totals: PinnedRowsProp<Person> = {
  top: [summaryRow(-1, 'Max', (values) => Math.max(...values))],
  bottom: [
    summaryRow(-2, 'Total', sum),
    summaryRow(-3, 'Average', (values) => sum(values) / values.length),
  ],
};

const meta = {
  ...baseMeta,
  title: 'TableWright/Row pinning',
  component: TableWright,
  args: {
    ...baseMeta.args,
    pinnedRows: totals,
    pinnedRowsSectionSeparator: 'border-and-shadow',
    initialState: { pagination: { paginationModel: { pageSize: 25, page: 0 } } },
  },
  argTypes: {
    ...baseMeta.argTypes,
    pinnedRowsSectionSeparator: {
      control: 'inline-radio',
      options: ['border', 'border-and-shadow'],
    },
  },
  parameters: {
    controls: {
      include: [...baseMeta.parameters.controls.include, 'pinnedRowsSectionSeparator'],
    },
  },
} satisfies Meta<StoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Scroll vertically: the Max row stays on top, Total and Average stay at the bottom. */
export const SummaryRows: Story = {};

export const BorderOnly: Story = {
  args: { pinnedRowsSectionSeparator: 'border' },
};

/** Sorting, filtering and pagination only apply to the scrolling rows. */
export const WithSortingAndFiltering: Story = {
  args: {
    showToolbar: true,
    initialState: {
      pagination: { paginationModel: { pageSize: 10, page: 0 } },
      sorting: { sortModel: [{ field: 'salary', sort: 'desc' }] },
      filter: {
        filterModel: { items: [{ field: 'department', operator: 'is', value: 'Engineering' }] },
      },
    },
  },
};

export const WithPinnedColumns: Story = {
  args: {
    initialState: {
      pagination: { paginationModel: { pageSize: 25, page: 0 } },
      pinnedColumns: { left: ['fullName'], right: ['salary'] },
    },
  },
  decorators: [narrow],
};

const PinFromActions = (args: StoryArgs) => {
  const [pinnedIds, setPinnedIds] = useState<{ top: GridRowId[]; bottom: GridRowId[] }>({
    top: [1],
    bottom: [],
  });

  const pinnedRows = useMemo<PinnedRowsProp<Person>>(
    () => ({
      top: rows.filter((row) => pinnedIds.top.includes(row.id)),
      bottom: rows.filter((row) => pinnedIds.bottom.includes(row.id)),
    }),
    [pinnedIds],
  );

  const actionColumns = useMemo<GridColDef<Person>[]>(() => {
    const move = (id: GridRowId, to: 'top' | 'bottom' | null) =>
      setPinnedIds((current) => ({
        top: to === 'top' ? [...current.top, id] : current.top.filter((pinned) => pinned !== id),
        bottom:
          to === 'bottom'
            ? [...current.bottom, id]
            : current.bottom.filter((pinned) => pinned !== id),
      }));
    return [
      {
        field: 'actions',
        type: 'actions',
        width: 120,
        getActions: ({ id }: GridRowParams<Person>) =>
          pinnedIds.top.includes(id) || pinnedIds.bottom.includes(id)
            ? [
                <GridActionsCellItem
                  key="unpin"
                  label="Unpin"
                  showInMenu
                  onClick={() => move(id, null)}
                />,
              ]
            : [
                <GridActionsCellItem
                  key="top"
                  label="Pin to top"
                  showInMenu
                  onClick={() => move(id, 'top')}
                />,
                <GridActionsCellItem
                  key="bottom"
                  label="Pin to bottom"
                  showInMenu
                  onClick={() => move(id, 'bottom')}
                />,
              ],
      },
      ...columns,
    ];
  }, [pinnedIds]);

  return (
    <Box sx={{ height: 520 }}>
      <TableWright {...args} columns={actionColumns} pinnedRows={pinnedRows} />
    </Box>
  );
};

/**
 * Rows pinned from an actions column. A pinned row also present in `rows` is shown only in its
 * pinned section, and returns to the scrolling rows when unpinned.
 */
export const PinFromRowActions: Story = {
  render: ({ loadingVariant: _loadingVariant, ...args }) => <PinFromActions {...args} />,
};
