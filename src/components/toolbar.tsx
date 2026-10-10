import ToolbarColumnsButton from '@components/toolbar-columns-button';
import ToolbarExportCsv from '@components/toolbar-export-csv';
import ToolbarFiltersButton from '@components/toolbar-filters-button';
import ToolbarGroup from '@components/toolbar-group';
import ToolbarLabel from '@components/toolbar-label';
import ToolbarSearch from '@components/toolbar-search';
import {
  Toolbar as GridToolbar,
  ToolbarRoot as GridToolbarRoot,
  type GridSlotProps,
} from '@mui/x-data-grid';

/**
 * Default `toolbar` slot: an always-open quick filter, the grid label and text buttons for
 * filters, columns and CSV export. Below the theme's `md` breakpoint the drop-ins go compact: the
 * search collapses behind a button and the text buttons become icon buttons with tooltips.
 * Printing is not offered, so `printOptions` is ignored.
 *
 * Pass children to lay out your own toolbar from the drop-ins (`ToolbarSearch`, `ToolbarLabel`,
 * `ToolbarGroup`, `ToolbarFiltersButton`, `ToolbarColumnsButton`, `ToolbarExportCsv`) or any
 * other element, then hand it to the grid as `slots={{ toolbar: MyToolbar }}`. The children
 * replace the default layout, so `showQuickFilter`, `quickFilterProps` and `csvOptions` no longer
 * apply: pass options to the drop-ins themselves.
 *
 * Styling props (`sx`, `className`, `style`) and other `<div>` attributes reach the toolbar root
 * in both modes; `sx` layers over the default `justifyContent` and `color`. Set them through
 * `slotProps.toolbar` for the default layout, or directly on `TableWrightToolbar` in your own.
 */
const Toolbar = ({
  showQuickFilter = true,
  quickFilterProps,
  csvOptions,
  printOptions: _printOptions,
  showHistoryControls: _showHistoryControls,
  slotProps: _slotProps,
  children,
  ...props
}: GridSlotProps['toolbar']) => (
  <GridToolbar
    {...props}
    render={({ sx, ...toolbarProps }) => (
      <GridToolbarRoot
        {...toolbarProps}
        // Array form, so a consumer `sx` (object, function or array) layers over the defaults.
        sx={[
          { justifyContent: 'space-between', color: ({ palette }) => palette.text.secondary },
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
      >
        {children ?? (
          <>
            {showQuickFilter && <ToolbarSearch {...quickFilterProps} />}
            <ToolbarLabel />
            <ToolbarGroup>
              <ToolbarFiltersButton />
              <ToolbarColumnsButton />
              <ToolbarExportCsv options={csvOptions} />
            </ToolbarGroup>
          </>
        )}
      </GridToolbarRoot>
    )}
  />
);

export default Toolbar;
