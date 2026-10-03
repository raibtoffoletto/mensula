import type { PinnedRowsProp, PinningContextValue } from '@contexts/pinning';
import { PinnedColumnSide } from '@lib/constants';
import type {
  DataGridProps,
  GridPinnedColumnFields,
  GridRowEntry,
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
   * Rows kept visible above/below the scrolling rows. Not sorted, filtered, paginated or
   * selectable. Keep the reference stable between renders.
   */
  pinnedRows?: PinnedRowsProp<R>;
  /** Separator between pinned and scrolling rows. @default 'border-and-shadow' */
  pinnedRowsSectionSeparator?: 'border' | 'border-and-shadow';
};

type PinningStateOptions = Pick<
  PinningProps,
  'pinnedColumns' | 'onPinnedColumnsChange' | 'disableColumnPinning' | 'pinnedRows'
> & {
  initialPinnedColumns?: GridPinnedColumnFields;
  columns: DataGridProps['columns'];
  getRowId?: DataGridProps['getRowId'];
};

const EMPTY_ROWS: GridRowEntry[] = [];

const toEntries = (
  rows: GridValidRowModel[] | undefined,
  getRowId: PinningStateOptions['getRowId'],
): GridRowEntry[] =>
  rows?.map((model) => ({ id: getRowId ? getRowId(model) : model.id, model })) ?? EMPTY_ROWS;

/** Owns the pinned-columns model (controlled or not) and normalizes `pinnedRows` to entries. */
const usePinningState = ({
  pinnedColumns: pinnedColumnsProp,
  onPinnedColumnsChange,
  disableColumnPinning = false,
  pinnedRows: pinnedRowsProp,
  initialPinnedColumns,
  columns,
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

  const declaredFieldOrder = useMemo(() => columns.map((column) => column.field), [columns]);

  const pinnedRows = useMemo(
    () => ({
      top: toEntries(pinnedRowsProp?.top, getRowId),
      bottom: toEntries(pinnedRowsProp?.bottom, getRowId),
    }),
    [pinnedRowsProp, getRowId],
  );

  return useMemo(
    () => ({
      pinnedColumns,
      setPinnedColumns,
      pinColumn,
      unpinColumn,
      isColumnPinned,
      disableColumnPinning,
      declaredFieldOrder,
      pinnedRows,
    }),
    [
      pinnedColumns,
      setPinnedColumns,
      pinColumn,
      unpinColumn,
      isColumnPinned,
      disableColumnPinning,
      declaredFieldOrder,
      pinnedRows,
    ],
  );
};

export default usePinningState;
