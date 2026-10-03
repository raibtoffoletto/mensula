import TableWright from '@components/table-wright';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { baseMeta, type StoryArgs } from './meta';
import { columns } from './data';

const editableColumns = columns.map((column) =>
  column.field === 'id' || column.field === 'fullName' ? column : { ...column, editable: true },
);

const meta = {
  ...baseMeta,
  title: 'TableWright/Editing',
  component: TableWright,
} satisfies Meta<StoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Editable: Story = {
  args: { columns: editableColumns },
};
