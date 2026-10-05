import ColumnMenu from '@components/column-menu';
import ColumnsManagement from '@components/columns-management';
import DetailPanelRow from '@components/detail-panel-row';
import FilterPanel from '@components/filter-panel';
import PinnedRows from '@components/pinned-rows';
import RowContextMenu from '@components/row-context-menu';
import useColumnHeaderContextMenu from '@hooks/use-column-header-context-menu';
import useColumnHeaderReorder from '@hooks/use-column-header-reorder';
import useColumnOrderState, { type ColumnReorderProps } from '@hooks/use-column-order-state';
import useDetailPanelState, { type DetailPanelProps } from '@hooks/use-detail-panel-state';
import useMultiFilterProps, { type FilteringProps } from '@hooks/use-multi-filter-props';
import usePinningState, { type PinningProps } from '@hooks/use-pinning-state';
import useRowHighlightOnShiftClick from '@hooks/use-row-highlight-on-shift-click';
import useRowHighlightState, { type RowHighlightProps } from '@hooks/use-row-highlight-state';
import type { PinnedRowsProp } from '@contexts/pinning';
import {
  ROW_HIGHLIGHTED_CLASS,
  ROW_MENU_LOCALE_TEXT,
  type RowMenuLocaleText,
} from '@lib/constants';
import { GRID_DETAIL_PANEL_TOGGLE_COL_DEF } from '@lib/detail-panel';
import { GRID_ROW_MENU_COL_DEF } from '@lib/row-menu';
import type { SxProps, Theme } from '@mui/material';
import {
  DataGrid,
  gridClasses,
  useGridApiRef,
  type DataGridProps,
  type GridInitialState,
  type GridLocaleText,
  type GridPinnedColumnFields,
  type GridRowId,
} from '@mui/x-data-grid';
import ColumnOrderProvider from '@providers/column-order';
import DetailPanelProvider from '@providers/detail-panel';
import FilteringProvider from '@providers/filtering';
import PinningProvider from '@providers/pinning';
import RowHighlightProvider from '@providers/row-highlight';
import { useMemo } from 'react';

export type TableWrightInitialState = GridInitialState & {
  detailPanel?: { expandedRowIds?: Set<GridRowId> };
  pinnedColumns?: GridPinnedColumnFields;
  pinnedRows?: PinnedRowsProp;
  highlightedRowIds?: Set<GridRowId>;
};

/** The grid's labels plus TableWright's own. */
export type TableWrightLocaleText = GridLocaleText & RowMenuLocaleText;

export type TableWrightProps = Omit<
  DataGridProps,
  'getDetailPanelContent' | 'initialState' | 'onColumnOrderChange' | 'localeText'
> &
  DetailPanelProps &
  PinningProps &
  ColumnReorderProps &
  FilteringProps &
  RowHighlightProps & {
    initialState?: TableWrightInitialState;
    /**
     * Adds a leading column (after the checkbox column) whose menu pins, unpins and highlights
     * the row. The column cannot be reordered, hidden or resized.
     */
    showRowMenu?: boolean;
    /**
     * Keeps the browser's context menu on rows and column headers. By default, right-clicking a
     * row opens its row menu at the pointer (with or without `showRowMenu`) and right-clicking a
     * column header opens its column menu (whether or not its menu button is showing).
     */
    disableContextMenu?: boolean;
    /**
     * Hides the column headers' menu button. Unlike `disableColumnMenu`, the column menu stays
     * reachable: right-click a header (unless `disableContextMenu`) or press Ctrl + Enter on it.
     */
    hideColumnMenu?: boolean;
    localeText?: Partial<TableWrightLocaleText>;
  };

const tint = (amount: string) =>
  `color-mix(in srgb, var(--TableWright-highlightColor) ${amount}, var(--DataGrid-t-color-background-base))`;
const pinnedLeft = `.${gridClasses['cell--pinnedLeft']}`;
const pinnedRight = `.${gridClasses['cell--pinnedRight']}`;

// Opaque tints, so pinned cells (which must cover the scrolling ones) match the rest of the row.
// Selection keeps its own color. Override `--TableWright-highlightColor` through `sx` to recolor.
const highlightSx: SxProps<Theme> = (theme) => ({
  '--TableWright-highlightColor': (theme.vars ?? theme).palette.warning.main,
  [`& .${gridClasses.row}.${ROW_HIGHLIGHTED_CLASS}:not(.Mui-selected)`]: {
    [`&, & ${pinnedLeft}, & ${pinnedRight}`]: { backgroundColor: tint('20%') },
    [`&:hover, &:hover ${pinnedLeft}, &:hover ${pinnedRight}`]: { backgroundColor: tint('28%') },
  },
});

// The button stays in the layout at zero width, as when unhovered: the open menu anchors to it.
const hideColumnMenuSx: SxProps<Theme> = {
  [`& .${gridClasses.menuIcon}`]: { width: '0 !important', visibility: 'hidden !important' },
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
  onPinnedRowsChange,
  disableColumnReorder,
  onColumnOrderChange,
  highlightedRowIds,
  onHighlightedRowIdsChange,
  disableRowHighlightOnShiftClick = false,
  disableMultipleColumnsFiltering = false,
  showRowMenu = false,
  disableContextMenu = false,
  hideColumnMenu = false,
  initialState: initialStateProp,
  ...props
}: TableWrightProps) => {
  const {
    detailPanel,
    pinnedColumns: initialPinnedColumns,
    pinnedRows: initialPinnedRows,
    highlightedRowIds: initialHighlightedRowIds,
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

  // Prepend the generated columns unless the consumer placed their own with the same field.
  const columns = useMemo(() => {
    const generated = [
      ...(showRowMenu ? [GRID_ROW_MENU_COL_DEF] : []),
      ...(hasDetailPanels ? [GRID_DETAIL_PANEL_TOGGLE_COL_DEF] : []),
    ].filter(({ field }) => !props.columns.some((column) => column.field === field));
    return generated.length > 0 ? [...generated, ...props.columns] : props.columns;
  }, [showRowMenu, hasDetailPanels, props.columns]);

  const pinningValue = usePinningState({
    apiRef,
    pinnedColumns,
    onPinnedColumnsChange,
    disableColumnPinning,
    pinnedRows,
    onPinnedRowsChange,
    initialPinnedColumns,
    initialPinnedRows,
    rows: props.rows,
    getRowId: props.getRowId,
  });

  const { value: rowHighlightValue, getRowClassName } = useRowHighlightState({
    highlightedRowIds,
    onHighlightedRowIdsChange,
    initialHighlightedRowIds,
    getRowClassName: props.getRowClassName,
  });

  useRowHighlightOnShiftClick(
    apiRef,
    rowHighlightValue.toggleRowHighlight,
    disableRowHighlightOnShiftClick,
  );

  const filterProps = useMultiFilterProps({
    apiRef,
    filterModel: props.filterModel,
    onFilterModelChange: props.onFilterModelChange,
    initialFilterModel: initialState.filter?.filterModel,
    disableMultipleColumnsFiltering,
  });

  const filteringValue = useMemo(
    () => ({ disableMultipleColumnsFiltering }),
    [disableMultipleColumnsFiltering],
  );

  const columnOrderValue = useColumnOrderState({
    apiRef,
    columns,
    initialOrderedFields: initialState.columns?.orderedFields,
    pinning: pinningValue,
    disableColumnReorder,
    onColumnOrderChange,
  });

  useColumnHeaderReorder(apiRef, columnOrderValue);

  useColumnHeaderContextMenu(apiRef, disableContextMenu);

  // The right-click menu renders next to the grid, outside `useRowMenuLocaleText`'s reach.
  const rowMenuText = useMemo<RowMenuLocaleText>(
    () => ({ ...ROW_MENU_LOCALE_TEXT, ...props.localeText }),
    [props.localeText],
  );

  const slots = useMemo(
    () => ({
      columnMenu: ColumnMenu,
      columnsManagement: ColumnsManagement,
      ...(!disableMultipleColumnsFiltering && { filterPanel: FilterPanel }),
      ...props.slots,
      pinnedRows: PinnedRows,
      ...(hasDetailPanels && { row: DetailPanelRow }),
    }),
    [disableMultipleColumnsFiltering, hasDetailPanels, props.slots],
  );

  // The community props type omits Pro-only props the grid still reads at runtime.
  const separators = { pinnedColumnsSectionSeparator, pinnedRowsSectionSeparator } as object;

  const sx = useMemo(
    () => [
      highlightSx,
      hideColumnMenu && hideColumnMenuSx,
      ...(Array.isArray(props.sx) ? props.sx : [props.sx]),
    ],
    [hideColumnMenu, props.sx],
  );

  return (
    <PinningProvider value={pinningValue}>
      <ColumnOrderProvider value={columnOrderValue}>
        <DetailPanelProvider value={detailPanelValue}>
          <RowHighlightProvider value={rowHighlightValue}>
            <FilteringProvider value={filteringValue}>
              <DataGrid
                {...props}
                {...separators}
                apiRef={apiRef}
                initialState={{
                  ...initialState,
                  ...(initialState.filter && {
                    filter: { ...initialState.filter, filterModel: filterProps.initialFilterModel },
                  }),
                }}
                filterModel={filterProps.filterModel}
                onFilterModelChange={filterProps.onFilterModelChange}
                columns={columns}
                slots={slots}
                sx={sx}
                getRowClassName={getRowClassName}
                getRowSpacing={hasDetailPanels ? getRowSpacing : props.getRowSpacing}
              />
            </FilteringProvider>
            <RowContextMenu apiRef={apiRef} text={rowMenuText} disabled={disableContextMenu} />
          </RowHighlightProvider>
        </DetailPanelProvider>
      </ColumnOrderProvider>
    </PinningProvider>
  );
};

export default TableWright;
