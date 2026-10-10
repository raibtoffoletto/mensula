import Mensula from '@components/mensula';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { baseMeta, type StoryArgs } from './meta';

const meta = {
  ...baseMeta,
  title: 'Mensula/Selection',
  component: Mensula,
} satisfies Meta<StoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const CheckboxSelection: Story = {
  args: { checkboxSelection: true, disableRowSelectionOnClick: true },
};

export const PreselectedRows: Story = {
  args: {
    checkboxSelection: true,
    rowSelectionModel: { type: 'include', ids: new Set([2, 3, 5]) },
  },
};
