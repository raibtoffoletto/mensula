import { createContext } from 'react';

/** Public surface of column reordering, returned by `useColumnReorder()`. */
export type ColumnReorderApi = {
  /**
   * Moves `field` to `targetField`'s position — after it when moving forward, before it when
   * moving back — and fires `onColumnOrderChange`. The column must be reorderable and in the same
   * pinned section as the target. A target with `disableReorder` is displaced only if the column
   * beyond it is reorderable, as in `DataGridPro`. Returns whether the column moved.
   */
  moveColumn: (field: string, targetField: string) => boolean;
  /** Whether the column can be moved: reordering is enabled and it has no `disableReorder`. */
  isColumnReorderable: (field: string) => boolean;
  /** Restores the declared (or `initialState.columns.orderedFields`) order. */
  resetColumnOrder: () => void;
  /** Whether the order differs from the one `resetColumnOrder()` restores. */
  hasColumnOrderChanged: boolean;
};

export type ColumnOrderContextValue = ColumnReorderApi & {
  disableColumnReorder: boolean;
  /** Declared fields in the user's order; unpinned columns return to their place in it. */
  fieldOrder: readonly string[];
  /** `moveColumn` without the event: a drag moves live and notifies once, on drop. */
  moveColumnSilently: (field: string, targetField: string) => boolean;
  /** Fires `onColumnOrderChange` if the column is no longer at `oldIndex`. */
  notifyColumnOrderChange: (field: string, oldIndex: number) => void;
};

const ColumnOrderContext = createContext<ColumnOrderContextValue | null>(null);

export default ColumnOrderContext;
