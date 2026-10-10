import Mensula from '@components/mensula';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { baseMeta, type StoryArgs } from './meta';

const meta = {
  ...baseMeta,
  title: 'Mensula/Playground',
  component: Mensula,
} satisfies Meta<StoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Every visual prop is wired to Controls — combine them freely. */
export const Playground: Story = {};
