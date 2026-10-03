import TableWright from '@components/table-wright';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { baseMeta, type StoryArgs } from './meta';

const meta = {
  ...baseMeta,
  title: 'TableWright/Playground',
  component: TableWright,
} satisfies Meta<StoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Every visual prop is wired to Controls — combine them freely. */
export const Playground: Story = {};
