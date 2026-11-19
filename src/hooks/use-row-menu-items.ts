import usePinningContext from '@hooks/use-pinning-context';
import useRowHighlight from '@hooks/use-row-highlight';
import { PinnedRowPosition, type RowMenuLocaleText } from '@lib/constants';
import { HighlightIcon, PinToBottomIcon, PinToTopIcon, UnpinIcon, type MenuIcon } from '@lib/icons';
import type { GridRowId } from '@mui/x-data-grid';
import { useCallback } from 'react';

export type RowMenuItem = { label: string; icon: MenuIcon; onClick: () => void };

/**
 * Items of a row's menu, shared by the menu column and the right-click menu: the pinning items in
 * the column menu's order, then the highlight toggle. Pinned rows that are not in `rows` (summary
 * rows) can only be highlighted: unpinning would drop them.
 */
const useRowMenuItems = (text: RowMenuLocaleText) => {
  const { isRowPinned, pinRow, unpinRow, isRowInRows } = usePinningContext();
  const { isRowHighlighted, toggleRowHighlight } = useRowHighlight();

  return useCallback(
    (id: GridRowId): RowMenuItem[] => {
      const position = isRowPinned(id);
      const pinTop = {
        label: text.rowMenuPinToTop,
        icon: PinToTopIcon,
        onClick: () => pinRow(id, PinnedRowPosition.Top),
      };
      const pinBottom = {
        label: text.rowMenuPinToBottom,
        icon: PinToBottomIcon,
        onClick: () => pinRow(id, PinnedRowPosition.Bottom),
      };
      const unpin = { label: text.rowMenuUnpin, icon: UnpinIcon, onClick: () => unpinRow(id) };

      let pinning = [pinTop, pinBottom];
      if (position && !isRowInRows(id)) {
        pinning = [];
      } else if (position === PinnedRowPosition.Top) {
        pinning = [unpin, pinBottom];
      } else if (position === PinnedRowPosition.Bottom) {
        pinning = [pinTop, unpin];
      }

      const highlight = {
        label: isRowHighlighted(id) ? text.rowMenuRemoveHighlight : text.rowMenuHighlight,
        icon: HighlightIcon,
        onClick: () => toggleRowHighlight(id),
      };
      return [...pinning, highlight];
    },
    [text, isRowPinned, pinRow, unpinRow, isRowInRows, isRowHighlighted, toggleRowHighlight],
  );
};

export default useRowMenuItems;
