import type { PinnedRowsProp, PinningContextValue } from '@contexts/pinning';
import { PinnedColumnSide, PinnedRowPosition } from '@lib/constants';
import type {
  DataGridProps,
  GridPinnedColumnFields,
  GridRowEntry,
  GridRowId,
  GridValidRowModel,
} from '@mui/x-data-grid';
import { useCallback, useMemo, useState } from 'react';

/** Pinning props, mirroring `DataGridPro`. */
// `any` default matches `DataGridProps<R = any>`, so typed row arrays stay assignable.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PinningProps<R extends GridValidRowModel = any> = {
  /** Controlled pinned columns. */
  pinnedColumns?: GridPinnedColumnFields;
  /** Fired when a column is pinned or unpinned. */
  onPinnedColumnsChange?: (pinnedColumns: GridPinnedColumnFields) => void;
  /** Hides the pin/unpin column menu items. Pinning via props still works. */
  disableColumnPinning?: boolean;
  /** Separator between pinned and scrolling columns. @default 'border-and-shadow' */
  pinnedColumnsSectionSeparator?: 'border' | 'shadow' | 'border-and-shadow';
  /**
   * Controlled rows kept visible above/below the scrolling rows. Not sorted, filtered, paginated
   * or selectable. A row also present in `rows` shows only in its pinned section. Keep the
   * reference stable between renders.
   */
  pinnedRows?: PinnedRowsProp<R>;
  /** Fired when a row is pinned or unpinned (row menu or `useRowPinning()`). */
  onPinnedRowsChange?: (pinnedRows: PinnedRowsProp<R>) => void;
  /** Separator between pinned and scrolling rows. @default 'border-and-shadow' */
  pinnedRowsSectionSeparator?: 'border' | 'border-and-shadow';
};

type PinningStateOptions = Pick<
  PinningProps,
  | 'pinnedColumns'
  | 'onPinnedColumnsChange'
  | 'disableColumnPinning'
  | 'pinnedRows'
  | 'onPinnedRowsChange'
> & {
  apiRef: NonNullable<DataGridProps['apiRef']>;
  initialPinnedColumns?: GridPinnedColumnFields;
  initialPinnedRows?: PinnedRowsProp;
  rows?: DataGridProps['rows'];
  getRowId?: DataGridProps['getRowId'];
};

const EMPTY_ROWS: GridRowEntry[] = [];

const toEntries = (
  rows: readonly GridValidRowModel[] | undefined,
  getRowId: PinningStateOptions['getRowId'],
): GridRowEntry[] =>
  rows?.map((model) => ({ id: getRowId ? getRowId(model) : model.id, model })) ?? EMPTY_ROWS;

/**
 * Owns the pinned-columns and pinned-rows models (each controlled or not) and normalizes pinned
 * rows to entries.
 */
const usePinningState = ({
  apiRef,
  pinnedColumns: pinnedColumnsProp,
  onPinnedColumnsChange,
  disableColumnPinning = false,
  pinnedRows: pinnedRowsProp,
  onPinnedRowsChange,
  initialPinnedColumns,
  initialPinnedRows,
  rows,
  getRowId,
}: PinningStateOptions): PinningContextValue => {
  const [uncontrolled, setUncontrolled] = useState<GridPinnedColumnFields>(
    () => initialPinnedColumns ?? {},
  );
  const isControlled = pinnedColumnsProp !== undefined;
  const pinnedColumns = pinnedColumnsProp ?? uncontrolled;

  const setPinnedColumns = useCallback(
    (next: GridPinnedColumnFields) => {
      if (!isControlled) {
        setUncontrolled(next);
      }
      onPinnedColumnsChange?.(next);
    },
    [isControlled, onPinnedColumnsChange],
  );

  const isColumnPinned = useCallback(
    (field: string): PinnedColumnSide | false => {
      if (pinnedColumns.left?.includes(field)) {
        return PinnedColumnSide.Left;
      }
      return pinnedColumns.right?.includes(field) ? PinnedColumnSide.Right : false;
    },
    [pinnedColumns],
  );

  const unpinColumn = useCallback(
    (field: string) =>
      setPinnedColumns({
        left: (pinnedColumns.left ?? []).filter((pinned) => pinned !== field),
        right: (pinnedColumns.right ?? []).filter((pinned) => pinned !== field),
      }),
    [pinnedColumns, setPinnedColumns],
  );

  // Like Pro: pinning appends to the side, pinning to the other side moves the column.
  const pinColumn = useCallback(
    (field: string, side: PinnedColumnSide) => {
      if (isColumnPinned(field) === side) {
        return;
      }
      const left = (pinnedColumns.left ?? []).filter((pinned) => pinned !== field);
      const right = (pinnedColumns.right ?? []).filter((pinned) => pinned !== field);
      setPinnedColumns(
        side === PinnedColumnSide.Left
          ? { left: [...left, field], right }
          : { left, right: [field, ...right] },
      );
    },
    [isColumnPinned, pinnedColumns, setPinnedColumns],
  );

  const [uncontrolledRows, setUncontrolledRows] = useState<PinnedRowsProp>(
    () => initialPinnedRows ?? {},
  );
  const isRowsControlled = pinnedRowsProp !== undefined;
  const pinnedRows = pinnedRowsProp ?? uncontrolledRows;

  const setPinnedRows = useCallback(
    (next: PinnedRowsProp) => {
      if (!isRowsControlled) {
        setUncontrolledRows(next);
      }
      onPinnedRowsChange?.(next);
    },
    [isRowsControlled, onPinnedRowsChange],
  );

  const pinnedRowEntries = useMemo(
    () => ({
      top: toEntries(pinnedRows.top, getRowId),
      bottom: toEntries(pinnedRows.bottom, getRowId),
    }),
    [pinnedRows, getRowId],
  );

  const isRowPinned = useCallback(
    (id: GridRowId): PinnedRowPosition | false => {
      if (pinnedRowEntries.top.some((entry) => entry.id === id)) {
        return PinnedRowPosition.Top;
      }
      return pinnedRowEntries.bottom.some((entry) => entry.id === id)
        ? PinnedRowPosition.Bottom
        : false;
    },
    [pinnedRowEntries],
  );

  const rowIds = useMemo(
    () => new Set(toEntries(rows, getRowId).map(({ id }) => id)),
    [rows, getRowId],
  );
  const isRowInRows = useCallback((id: GridRowId) => rowIds.has(id), [rowIds]);

  // Models are kept in their section's original order; only the moved row changes place.
  const withoutRow = useCallback(
    (id: GridRowId) => ({
      top: pinnedRowEntries.top.filter((entry) => entry.id !== id).map(({ model }) => model),
      bottom: pinnedRowEntries.bottom.filter((entry) => entry.id !== id).map(({ model }) => model),
    }),
    [pinnedRowEntries],
  );

  const unpinRow = useCallback(
    (id: GridRowId) => {
      if (isRowPinned(id)) {
        setPinnedRows(withoutRow(id));
      }
    },
    [isRowPinned, setPinnedRows, withoutRow],
  );

  // Like column pinning: rows land next to the scrolling rows.
  const pinRow = useCallback(
    (id: GridRowId, position: PinnedRowPosition) => {
      const current = isRowPinned(id);
      if (current === position) {
        return;
      }
      const model = current
        ? pinnedRowEntries[current].find((entry) => entry.id === id)?.model
        : apiRef.current?.getRow(id);
      if (!model) {
        return;
      }
      const { top, bottom } = withoutRow(id);
      setPinnedRows(
        position === PinnedRowPosition.Top
          ? { top: [...top, model], bottom }
          : { top, bottom: [model, ...bottom] },
      );
    },
    [apiRef, isRowPinned, pinnedRowEntries, setPinnedRows, withoutRow],
  );

  return useMemo(
    () => ({
      pinnedColumns,
      setPinnedColumns,
      pinColumn,
      unpinColumn,
      isColumnPinned,
      disableColumnPinning,
      pinnedRows,
      setPinnedRows,
      pinRow,
      unpinRow,
      isRowPinned,
      pinnedRowEntries,
      isRowInRows,
    }),
    [
      pinnedColumns,
      setPinnedColumns,
      pinColumn,
      unpinColumn,
      isColumnPinned,
      disableColumnPinning,
      pinnedRows,
      setPinnedRows,
      pinRow,
      unpinRow,
      isRowPinned,
      pinnedRowEntries,
      isRowInRows,
    ],
  );
};

export default usePinningState;
