import type { Meta, StoryObj } from '@storybook/react';
import TableWright from './table-wright';

const meta: Meta<typeof TableWright> = {
  title: 'Components/TableWright',
  component: TableWright,
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<typeof TableWright>;

const columns = [
  { field: 'id', headerName: 'ID', width: 90 },
  { field: 'firstName', headerName: 'First name', width: 150 },
  { field: 'lastName', headerName: 'Last name', width: 150 },
  { field: 'age', headerName: 'Age', type: 'number' as const, width: 110 },
];

const rows = [
  { id: 1, lastName: 'Lovelace', firstName: 'Ada', age: 36 },
  { id: 2, lastName: 'Torvalds', firstName: 'Linus', age: 54 },
  { id: 3, lastName: 'Hopper', firstName: 'Grace', age: 85 },
  { id: 4, lastName: 'Ritchie', firstName: 'Dennis', age: 70 },
  { id: 5, lastName: 'Turing', firstName: 'Alan', age: 41 },
];

export const Basic: Story = {
  args: {
    rows,
    columns,
    initialState: {
      pagination: { paginationModel: { pageSize: 5, page: 0 } },
    },
    pageSizeOptions: [5, 10],
  },
  render: (args) => (
    <div style={{ height: 400, width: '100%' }}>
      <TableWright {...args} />
    </div>
  ),
};
