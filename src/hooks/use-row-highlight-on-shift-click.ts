import type { RowHighlightApi } from '@contexts/row-highlight';
import type { DataGridProps, GridEventListener } from '@mui/x-data-grid';
import { useEffect } from 'react';

/**
 * Shift + click on a row toggles its highlight. The listener runs before the grid's own (it
 * subscribes as high priority after them, and those run last-in first), then marks the event
 * handled, so neither range selection nor `onRowClick` sees it. Clicks in the checkbox, detail
 * toggle and actions (row menu) cells never publish `rowClick`, so they keep their behavior.
 */
const useRowHighlightOnShiftClick = (
  apiRef: NonNullable<DataGridProps['apiRef']>,
  toggleRowHighlight: RowHighlightApi['toggleRowHighlight'],
  disabled: boolean,
) => {
  useEffect(() => {
    if (disabled) {
      return undefined;
    }
    const handleRowClick: GridEventListener<'rowClick'> = ({ id }, event) => {
      if (!event.shiftKey || event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }
      event.defaultMuiPrevented = true;
      // Shift + click extends the browser's text selection from the previous click.
      window.getSelection()?.removeAllRanges();
      toggleRowHighlight(id);
    };
    return apiRef.current?.subscribeEvent('rowClick', handleRowClick, { isFirst: true });
  }, [apiRef, toggleRowHighlight, disabled]);
};

export default useRowHighlightOnShiftClick;
