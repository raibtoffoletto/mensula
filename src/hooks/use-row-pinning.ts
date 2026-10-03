import type { RowPinningApi } from '@contexts/pinning';
import usePinningContext from '@hooks/use-pinning-context';

/**
 * Reads and drives row pinning from inside the grid — custom row menus, action cells, toolbars.
 * Changes go through `onPinnedRowsChange` when `pinnedRows` is controlled.
 */
const useRowPinning = (): RowPinningApi => {
  const { pinnedRows, setPinnedRows, pinRow, unpinRow, isRowPinned } = usePinningContext();
  return { pinnedRows, setPinnedRows, pinRow, unpinRow, isRowPinned };
};

export default useRowPinning;
