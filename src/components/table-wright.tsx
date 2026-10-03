import DetailPanelRow from '@components/detail-panel-row';
import useDetailPanelState, { type DetailPanelProps } from '@hooks/use-detail-panel-state';
import {
  GRID_DETAIL_PANEL_TOGGLE_COL_DEF,
  GRID_DETAIL_PANEL_TOGGLE_FIELD,
} from '@lib/detail-panel';
import {
  DataGrid,
  useGridApiRef,
  type DataGridProps,
  type GridInitialState,
  type GridRowId,
} from '@mui/x-data-grid';
import DetailPanelProvider from '@providers/detail-panel';
import { useMemo } from 'react';

export type TableWrightInitialState = GridInitialState & {
  detailPanel?: { expandedRowIds?: Set<GridRowId> };
};

export type TableWrightProps = Omit<DataGridProps, 'getDetailPanelContent' | 'initialState'> &
  DetailPanelProps & {
    initialState?: TableWrightInitialState;
  };

const TableWright = ({
  getDetailPanelContent,
  getDetailPanelHeight,
  detailPanelExpandedRowIds,
  onDetailPanelExpandedRowIdsChange,
  initialState: initialStateProp,
  ...props
}: TableWrightProps) => {
  const { detailPanel, ...initialState } = initialStateProp ?? {};
  const internalApiRef = useGridApiRef();
  const apiRef = props.apiRef ?? internalApiRef;
  const hasDetailPanels = getDetailPanelContent !== undefined;

  const { value, getRowSpacing } = useDetailPanelState({
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

  const slots = useMemo(() => ({ ...props.slots, row: DetailPanelRow }), [props.slots]);

  if (!hasDetailPanels) {
    return <DataGrid {...props} apiRef={apiRef} initialState={initialState} />;
  }

  return (
    <DetailPanelProvider value={value}>
      <DataGrid
        {...props}
        apiRef={apiRef}
        initialState={initialState}
        columns={columns}
        slots={slots}
        getRowSpacing={getRowSpacing}
      />
    </DetailPanelProvider>
  );
};

export default TableWright;
