import TableWright from '@components/table-wright';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { baseMeta, type StoryArgs } from './meta';

const meta = {
  ...baseMeta,
  title: 'TableWright/Loading & empty',
  component: TableWright,
} satisfies Meta<StoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Skeleton: Story = {
  args: { loading: true, loadingVariant: 'skeleton', rows: [] },
};

export const CircularProgress: Story = {
  args: { loading: true, loadingVariant: 'circular-progress', rows: [] },
};

export const LinearProgressOverRows: Story = {
  name: 'Linear progress (refetch over rows)',
  args: { loading: true, loadingVariant: 'linear-progress' },
};

export const Empty: Story = {
  args: { rows: [] },
};
