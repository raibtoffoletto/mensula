import type { ColumnPinningApi } from '@contexts/pinning';
import usePinningContext from '@hooks/use-pinning-context';

/**
 * Reads and drives column pinning from inside the grid — custom column menus, header buttons,
 * toolbars. Stands in for `DataGridPro`'s `apiRef.current.pinColumn()` & co.
 */
const useColumnPinning = (): ColumnPinningApi => {
  const { pinnedColumns, setPinnedColumns, pinColumn, unpinColumn, isColumnPinned } =
    usePinningContext();
  return { pinnedColumns, setPinnedColumns, pinColumn, unpinColumn, isColumnPinned };
};

export default useColumnPinning;
