import TableWright from '@components/table-wright';
import { Alert, Box } from '@mui/material';
import type { GridColumnOrderChangeParams } from '@mui/x-data-grid';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { columns } from './data';
import { baseMeta, narrow, type StoryArgs } from './meta';

const meta = {
  ...baseMeta,
  title: 'TableWright/Column reordering',
  component: TableWright,
  args: {
    ...baseMeta.args,
    showToolbar: true,
    disableColumnReorder: false,
  },
  parameters: {
    controls: {
      include: [...baseMeta.parameters.controls.include, 'disableColumnReorder'],
    },
  },
  decorators: [narrow],
} satisfies Meta<StoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Drag a header to move its column (scroll by dragging toward an edge). Or open Columns in the
 * toolbar and drag a row's handle — or focus it and press ArrowUp/ArrowDown. Reset restores the
 * order too.
 */
export const Default: Story = {};

/** Columns move only within their section: left-pinned, scrolling, or right-pinned. */
export const WithPinnedColumns: Story = {
  args: {
    checkboxSelection: true,
    initialState: {
      ...baseMeta.args.initialState,
      pinnedColumns: { left: ['__check__', 'id', 'fullName'], right: ['active'] },
    },
  },
};

/** ID and Age have `disableReorder`: they cannot be dragged, only nudged by a passing column. */
export const FixedColumns: Story = {
  args: {
    columns: columns.map((column) => ({
      ...column,
      disableReorder: column.field === 'id' || column.field === 'age',
    })),
  },
};

export const InitialOrder: Story = {
  args: {
    initialState: {
      ...baseMeta.args.initialState,
      columns: { orderedFields: ['fullName', 'department', 'salary', 'id'] },
    },
  },
};

export const Disabled: Story = {
  args: { disableColumnReorder: true },
};

const OrderLog = (args: StoryArgs) => {
  const [last, setLast] = useState<GridColumnOrderChangeParams | null>(null);
  return (
    <>
      <Alert severity="info" sx={{ mb: 1 }}>
        <code>
          onColumnOrderChange:{' '}
          {last ? `${last.column.field}: ${last.oldIndex} → ${last.targetIndex}` : 'move a column'}
        </code>
      </Alert>
      <Box sx={{ height: 520 }}>
        <TableWright {...args} onColumnOrderChange={setLast} />
      </Box>
    </>
  );
};

export const OnColumnOrderChange: Story = {
  render: ({ loadingVariant: _loadingVariant, ...args }) => <OrderLog {...args} />,
};
