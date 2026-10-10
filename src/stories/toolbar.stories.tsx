import Mensula from '@components/mensula';
import Toolbar from '@components/toolbar';
import ToolbarColumnsButton from '@components/toolbar-columns-button';
import ToolbarExportCsv from '@components/toolbar-export-csv';
import ToolbarFiltersButton from '@components/toolbar-filters-button';
import ToolbarGroup from '@components/toolbar-group';
import ToolbarLabel from '@components/toolbar-label';
import ToolbarSearch from '@components/toolbar-search';
import { Button } from '@mui/material';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { baseMeta, type StoryArgs } from './meta';

const meta = {
  ...baseMeta,
  title: 'Mensula/Toolbar',
  component: Mensula,
  args: { ...baseMeta.args, showToolbar: true, label: 'Computing pioneers' },
} satisfies Meta<StoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Search, label, then filters, columns and CSV export. */
export const Default: Story = {};

/**
 * The drop-ins rearranged inside `MensulaToolbar`, next to a consumer's own button. Grid
 * props still apply: `disableColumnFilter` or `disableColumnSelector` hide their buttons.
 */
export const Custom: Story = {
  args: {
    slots: {
      toolbar: () => (
        <Toolbar>
          <ToolbarGroup>
            <ToolbarExportCsv options={{ fileName: 'pioneers' }} />
            <ToolbarColumnsButton />
            <ToolbarFiltersButton />
            <Button size="small" variant="outlined">
              Add pioneer
            </Button>
          </ToolbarGroup>
          <ToolbarLabel />
          <ToolbarSearch debounceMs={500} />
        </Toolbar>
      ),
    },
  },
};

/** Just the search field. */
export const SearchOnly: Story = {
  args: {
    slots: {
      toolbar: () => (
        <Toolbar>
          <ToolbarSearch />
        </Toolbar>
      ),
    },
  },
};

/** The default layout with its root restyled through `slotProps.toolbar`. */
export const Styled: Story = {
  args: {
    slotProps: {
      toolbar: {
        sx: { px: 2, bgcolor: 'action.hover', color: 'primary.main' },
      },
    },
  },
};
