import RowMenuCell from '@components/row-menu-cell';
import RowMenuHeader from '@components/row-menu-header';
import type { GridColDef } from '@mui/x-data-grid';

/**
 * An `actions` column: the community `GridRow` skips `rowClick` for it, so opening the menu never
 * selects the row.
 */
export const GRID_ROW_MENU_FIELD = '__row_menu__';

/**
 * Row menu column added automatically by `showRowMenu`. Spread it into your own column (same
 * `field`) to move the menu or swap its `renderCell`/`renderHeader`.
 */
export const GRID_ROW_MENU_COL_DEF: GridColDef = {
  field: GRID_ROW_MENU_FIELD,
  type: 'actions',
  headerName: 'Row menu',
  width: 50,
  align: 'center',
  headerAlign: 'center',
  editable: false,
  sortable: false,
  filterable: false,
  resizable: false,
  hideable: false,
  disableColumnMenu: true,
  disableReorder: true,
  disableExport: true,
  getActions: () => [],
  renderHeader: () => <RowMenuHeader />,
  renderCell: (params) => <RowMenuCell {...params} />,
};
