import type { ColumnOrderContextValue } from '@contexts/column-order';
import type { ColumnPinningApi } from '@contexts/pinning';
import {
  gridColumnFieldsSelector,
  type DataGridProps,
  type GridEventListener,
} from '@mui/x-data-grid';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

/** Column reordering props, mirroring `DataGridPro`. */
export type ColumnReorderProps = {
  /** Disables reordering by dragging headers or columns-panel rows. `useColumnReorder()` still works. */
  disableColumnReorder?: boolean;
  /** Fired when a column is dropped at a new position, or moved with `useColumnReorder()`. */
  onColumnOrderChange?: GridEventListener<'columnOrderChange'>;
};

type ColumnOrderStateOptions = ColumnReorderProps & {
  apiRef: NonNullable<DataGridProps['apiRef']>;
  columns: DataGridProps['columns'];
  initialOrderedFields?: string[];
  pinning: Pick<ColumnPinningApi, 'pinnedColumns' | 'setPinnedColumns' | 'isColumnPinned'>;
};

/**
 * Keeps `order`'s sequence for fields still declared, drops the rest, and slots newly declared
 * fields in after their declared predecessor.
 */
const mergeFieldOrder = (order: readonly string[] | undefined, declared: string[]): string[] => {
  if (!order) {
    return declared;
  }
  const declaredSet = new Set(declared);
  const merged = order.filter((field) => declaredSet.has(field));
  const placed = new Set(merged);
  declared.forEach((field, index) => {
    if (!placed.has(field)) {
      const predecessor = declared[index - 1];
      merged.splice(predecessor === undefined ? 0 : merged.indexOf(predecessor) + 1, 0, field);
      placed.add(field);
    }
  });
  return merged;
};

/** Moves `field` to `target`'s index: after it when moving forward, before it when moving back. */
const moveItem = (list: readonly string[], field: string, target: string): string[] => {
  const next = list.filter((item) => item !== field);
  next.splice(list.indexOf(target), 0, field);
  return next;
};

const sameOrder = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((field, index) => field === b[index]);

/**
 * Owns the user's column order. The grid never stores it: `PinningSync`'s `hydrateColumns`
 * processor ranks unpinned columns by it, so it survives pinning changes and new `columns` arrays.
 * Pinned columns are ordered by the `pinnedColumns` model instead, which a move within a pinned
 * section updates (as in `DataGridPro`).
 */
const useColumnOrderState = ({
  apiRef,
  columns,
  initialOrderedFields,
  pinning: { pinnedColumns, setPinnedColumns, isColumnPinned },
  disableColumnReorder = false,
  onColumnOrderChange,
}: ColumnOrderStateOptions): ColumnOrderContextValue => {
  const [order, setOrder] = useState(initialOrderedFields);
  const declared = useMemo(() => columns.map((column) => column.field), [columns]);
  const fieldOrder = useMemo(() => mergeFieldOrder(order, declared), [order, declared]);
  const initialFieldOrder = useMemo(
    () => mergeFieldOrder(initialOrderedFields, declared),
    [initialOrderedFields, declared],
  );
  // Read by `moveColumnSilently`, which a drag may call several times before React re-renders.
  const fieldOrderRef = useRef(fieldOrder);
  const pinnedColumnsRef = useRef(pinnedColumns);
  const pendingChangeRef = useRef<{ field: string; oldIndex: number } | null>(null);

  const isColumnReorderable = useCallback(
    (field: string) =>
      !disableColumnReorder && apiRef.current?.getColumn(field)?.disableReorder !== true,
    [apiRef, disableColumnReorder],
  );

  const getIndex = useCallback(
    (field: string) => (apiRef.current ? gridColumnFieldsSelector(apiRef).indexOf(field) : -1),
    [apiRef],
  );

  // As in DataGridPro, a column with `disableReorder` can be displaced by one position, unless the
  // column beyond it is fixed too (or missing): that keeps fixed leading columns first.
  const canTakePositionOf = useCallback(
    (field: string, targetField: string) => {
      if (isColumnReorderable(targetField)) {
        return true;
      }
      const fields = apiRef.current ? gridColumnFieldsSelector(apiRef) : [];
      const targetIndex = fields.indexOf(targetField);
      const beyond = fields[targetIndex + Math.sign(targetIndex - fields.indexOf(field))];
      return beyond !== undefined && isColumnReorderable(beyond);
    },
    [apiRef, isColumnReorderable],
  );

  const moveColumnSilently = useCallback(
    (field: string, targetField: string) => {
      const side = isColumnPinned(field);
      if (
        field === targetField ||
        !isColumnReorderable(field) ||
        side !== isColumnPinned(targetField) ||
        !canTakePositionOf(field, targetField)
      ) {
        return false;
      }
      if (side) {
        const pinned = pinnedColumnsRef.current;
        const next = { ...pinned, [side]: moveItem(pinned[side] ?? [], field, targetField) };
        pinnedColumnsRef.current = next;
        setPinnedColumns(next);
        return true;
      }
      const current = fieldOrderRef.current;
      if (!current.includes(field) || !current.includes(targetField)) {
        return false;
      }
      const next = moveItem(current, field, targetField);
      fieldOrderRef.current = next;
      setOrder(next);
      return true;
    },
    [isColumnPinned, isColumnReorderable, canTakePositionOf, setPinnedColumns],
  );

  const notifyColumnOrderChange = useCallback(
    (field: string, oldIndex: number) => {
      const api = apiRef.current;
      const column = api?.getColumn(field);
      const targetIndex = getIndex(field);
      if (api && column && targetIndex !== -1 && targetIndex !== oldIndex) {
        api.publishEvent('columnOrderChange', { column, oldIndex, targetIndex });
      }
    },
    [apiRef, getIndex],
  );

  // The event reports the new index, so it waits for the grid to apply the move (the pinning sync
  // does so in a layout effect, which runs before this hook's).
  const moveColumn = useCallback(
    (field: string, targetField: string) => {
      const oldIndex = getIndex(field);
      const moved = moveColumnSilently(field, targetField);
      if (moved) {
        pendingChangeRef.current = { field, oldIndex };
      }
      return moved;
    },
    [getIndex, moveColumnSilently],
  );

  useLayoutEffect(() => {
    fieldOrderRef.current = fieldOrder;
    pinnedColumnsRef.current = pinnedColumns;
    const pending = pendingChangeRef.current;
    pendingChangeRef.current = null;
    if (pending) {
      notifyColumnOrderChange(pending.field, pending.oldIndex);
    }
  }, [fieldOrder, pinnedColumns, notifyColumnOrderChange]);

  useEffect(
    () =>
      onColumnOrderChange &&
      apiRef.current?.subscribeEvent('columnOrderChange', onColumnOrderChange),
    [apiRef, onColumnOrderChange],
  );

  const resetColumnOrder = useCallback(
    () => setOrder(initialOrderedFields),
    [initialOrderedFields],
  );
  const hasColumnOrderChanged = !sameOrder(fieldOrder, initialFieldOrder);

  return useMemo(
    () => ({
      moveColumn,
      isColumnReorderable,
      resetColumnOrder,
      hasColumnOrderChanged,
      disableColumnReorder,
      fieldOrder,
      moveColumnSilently,
      notifyColumnOrderChange,
    }),
    [
      moveColumn,
      isColumnReorderable,
      resetColumnOrder,
      hasColumnOrderChanged,
      disableColumnReorder,
      fieldOrder,
      moveColumnSilently,
      notifyColumnOrderChange,
    ],
  );
};

export default useColumnOrderState;
