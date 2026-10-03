import { CONTEXT_MENU_IGNORED_SELECTOR } from '@lib/constants';
import { gridClasses, type DataGridProps, type GridEventListener } from '@mui/x-data-grid';
import { useEffect } from 'react';

/**
 * Right-clicking a column header opens its column menu, anchored to the header's menu button
 * whether or not that button is showing (it stays in the DOM, hidden until hover). Headers without
 * a menu (`disableColumnMenu`, generated columns) keep the browser's context menu.
 */
const useColumnHeaderContextMenu = (
  apiRef: NonNullable<DataGridProps['apiRef']>,
  disabled: boolean,
) => {
  useEffect(() => {
    if (disabled) {
      return undefined;
    }
    const handleContextMenu: GridEventListener<'columnHeaderContextMenu'> = ({ field }, event) => {
      const target = event.target as Element;
      const header = target.closest(`.${gridClasses.columnHeader}`);
      if (
        target.closest(CONTEXT_MENU_IGNORED_SELECTOR) ||
        !header?.querySelector(`.${gridClasses.menuIconButton}`)
      ) {
        return;
      }
      event.preventDefault();
      apiRef.current?.showColumnMenu(field);
    };
    return apiRef.current?.subscribeEvent('columnHeaderContextMenu', handleContextMenu);
  }, [apiRef, disabled]);
};

export default useColumnHeaderContextMenu;
