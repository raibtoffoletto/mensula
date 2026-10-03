import ColumnMenu from '@components/column-menu';
import ColumnsManagement from '@components/columns-management';
import DetailPanelRow from '@components/detail-panel-row';
import PinnedRows from '@components/pinned-rows';
import useColumnHeaderReorder from '@hooks/use-column-header-reorder';
import useColumnOrderState, { type ColumnReorderProps } from '@hooks/use-column-order-state';
import useDetailPanelState, { type DetailPanelProps } from '@hooks/use-detail-panel-state';
import usePinningState, { type PinningProps } from '@hooks/use-pinning-state';
import {
  GRID_DETAIL_PANEL_TOGGLE_COL_DEF,
  GRID_DETAIL_PANEL_TOGGLE_FIELD,
} from '@lib/detail-panel';
import {
  DataGrid,
  useGridApiRef,
  type DataGridProps,
  type GridInitialState,
  type GridPinnedColumnFields,
  type GridRowId,
} from '@mui/x-data-grid';
import ColumnOrderProvider from '@providers/column-order';
import DetailPanelProvider from '@providers/detail-panel';
import PinningProvider from '@providers/pinning';
import { useMemo } from 'react';

export type TableWrightInitialState = GridInitialState & {
  detailPanel?: { expandedRowIds?: Set<GridRowId> };
  pinnedColumns?: GridPinnedColumnFields;
};

export type TableWrightProps = Omit<
  DataGridProps,
  'getDetailPanelContent' | 'initialState' | 'onColumnOrderChange'
> &
  DetailPanelProps &
  PinningProps &
  ColumnReorderProps & {
    initialState?: TableWrightInitialState;
  };

const TableWright = ({
  getDetailPanelContent,
  getDetailPanelHeight,
  detailPanelExpandedRowIds,
  onDetailPanelExpandedRowIdsChange,
  pinnedColumns,
  onPinnedColumnsChange,
  disableColumnPinning,
  pinnedColumnsSectionSeparator = 'border-and-shadow',
  pinnedRows,
  pinnedRowsSectionSeparator = 'border-and-shadow',
  disableColumnReorder,
  onColumnOrderChange,
  initialState: initialStateProp,
  ...props
}: TableWrightProps) => {
  const {
    detailPanel,
    pinnedColumns: initialPinnedColumns,
    ...initialState
  } = initialStateProp ?? {};
  const internalApiRef = useGridApiRef();
  const apiRef = props.apiRef ?? internalApiRef;
  const hasDetailPanels = getDetailPanelContent !== undefined;

  const { value: detailPanelValue, getRowSpacing } = useDetailPanelState({
    apiRef,
    getDetailPanelContent,
    getDetailPanelHeight,
    detailPanelExpandedRowIds,
    onDetailPanelExpandedRowIdsChange,
    initialExpandedRowIds: detailPanel?.expandedRowIds,
    getRowSpacing: props.getRowSpacing,
    rowSlot: props.slots?.row,
  });

  // Prepend the toggle unless the consumer placed their own column with the toggle field.
  const columns = useMemo(
    () =>
      !hasDetailPanels ||
      props.columns.some((column) => column.field === GRID_DETAIL_PANEL_TOGGLE_FIELD)
        ? props.columns
        : [GRID_DETAIL_PANEL_TOGGLE_COL_DEF, ...props.columns],
    [hasDetailPanels, props.columns],
  );

  const pinningValue = usePinningState({
    pinnedColumns,
    onPinnedColumnsChange,
    disableColumnPinning,
    pinnedRows,
    initialPinnedColumns,
    getRowId: props.getRowId,
  });

  const columnOrderValue = useColumnOrderState({
    apiRef,
    columns,
    initialOrderedFields: initialState.columns?.orderedFields,
    pinning: pinningValue,
    disableColumnReorder,
    onColumnOrderChange,
  });

  useColumnHeaderReorder(apiRef, columnOrderValue);

  const slots = useMemo(
    () => ({
      columnMenu: ColumnMenu,
      columnsManagement: ColumnsManagement,
      ...props.slots,
      pinnedRows: PinnedRows,
      ...(hasDetailPanels && { row: DetailPanelRow }),
    }),
    [hasDetailPanels, props.slots],
  );

  // The community props type omits Pro-only props the grid still reads at runtime.
  const separators = { pinnedColumnsSectionSeparator, pinnedRowsSectionSeparator } as object;

  return (
    <PinningProvider value={pinningValue}>
      <ColumnOrderProvider value={columnOrderValue}>
        <DetailPanelProvider value={detailPanelValue}>
          <DataGrid
            {...props}
            {...separators}
            apiRef={apiRef}
            initialState={initialState}
            columns={columns}
            slots={slots}
            getRowSpacing={hasDetailPanels ? getRowSpacing : props.getRowSpacing}
          />
        </DetailPanelProvider>
      </ColumnOrderProvider>
    </PinningProvider>
  );
};

export default TableWright;
