import type { ColumnReorderApi } from '@contexts/column-order';
import useColumnOrderContext from '@hooks/use-column-order-context';

/**
 * Reads and drives column order from inside the grid — custom column panels, menus, toolbars.
 * Stands in for `DataGridPro`'s `apiRef.current.setColumnIndex()`.
 */
const useColumnReorder = (): ColumnReorderApi => {
  const { moveColumn, isColumnReorderable, resetColumnOrder, hasColumnOrderChanged } =
    useColumnOrderContext();
  return { moveColumn, isColumnReorderable, resetColumnOrder, hasColumnOrderChanged };
};

export default useColumnReorder;
