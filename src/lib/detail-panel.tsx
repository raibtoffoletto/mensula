import DetailPanelToggleCell from '@components/detail-panel-toggle-cell';
import DetailPanelToggleHeader from '@components/detail-panel-toggle-header';
import type { GridColDef } from '@mui/x-data-grid';

/**
 * Same value as `DataGridPro`: the community `GridRow` already skips `rowClick` for cells in this
 * column, so toggling a panel never selects the row.
 */
export const GRID_DETAIL_PANEL_TOGGLE_FIELD = '__detail_panel_toggle__';

export const DEFAULT_DETAIL_PANEL_HEIGHT = 500;

/**
 * Toggle column added automatically when `getDetailPanelContent` is set. Spread it into your own
 * column (same `field`) to move the toggle or swap its `renderCell`/`renderHeader`.
 */
export const GRID_DETAIL_PANEL_TOGGLE_COL_DEF: GridColDef = {
  field: GRID_DETAIL_PANEL_TOGGLE_FIELD,
  type: 'custom',
  headerName: '',
  width: 40,
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
  renderHeader: () => <DetailPanelToggleHeader />,
  renderCell: (params) => <DetailPanelToggleCell {...params} />,
};
