import Mensula from '@components/mensula';
import { Alert, Box } from '@mui/material';
import type { GridPinnedColumnFields } from '@mui/x-data-grid';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { baseMeta, narrow, type StoryArgs } from './meta';

const meta = {
  ...baseMeta,
  title: 'Mensula/Column pinning',
  component: Mensula,
  args: {
    ...baseMeta.args,
    pinnedColumnsSectionSeparator: 'border-and-shadow',
    initialState: {
      ...baseMeta.args.initialState,
      pinnedColumns: { left: ['fullName'], right: ['active'] },
    },
  },
  argTypes: {
    ...baseMeta.argTypes,
    pinnedColumnsSectionSeparator: {
      control: 'inline-radio',
      options: ['border', 'shadow', 'border-and-shadow'],
    },
  },
  parameters: {
    controls: {
      include: [
        ...baseMeta.parameters.controls.include,
        'pinnedColumnsSectionSeparator',
        'disableColumnPinning',
      ],
    },
  },
  decorators: [narrow],
} satisfies Meta<StoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Scroll horizontally: Full name stays left, Active stays right. Use a column menu to re-pin. */
export const InitialState: Story = {};

export const BorderOnly: Story = {
  args: { pinnedColumnsSectionSeparator: 'border' },
};

export const ShadowOnly: Story = {
  args: { pinnedColumnsSectionSeparator: 'shadow' },
};

export const PinnedCheckboxColumn: Story = {
  args: {
    checkboxSelection: true,
    initialState: {
      ...baseMeta.args.initialState,
      pinnedColumns: { left: ['__check__', 'fullName'] },
    },
  },
};

/** Pinned from props while the column menu offers no pinning items. */
export const MenuItemsDisabled: Story = {
  args: { disableColumnPinning: true },
};

const ControlledPinning = (args: StoryArgs) => {
  const [pinnedColumns, setPinnedColumns] = useState<GridPinnedColumnFields>({
    left: ['lastName'],
  });
  return (
    <>
      <Alert severity="info" sx={{ mb: 1 }}>
        <code>pinnedColumns: {JSON.stringify(pinnedColumns)}</code>
      </Alert>
      <Box sx={{ height: 520 }}>
        <Mensula
          {...args}
          pinnedColumns={pinnedColumns}
          onPinnedColumnsChange={setPinnedColumns}
        />
      </Box>
    </>
  );
};

export const Controlled: Story = {
  render: ({ loadingVariant: _loadingVariant, ...args }) => <ControlledPinning {...args} />,
};
