import ContextMenu from '@components/context-menu';
import useRowMenuItems from '@hooks/use-row-menu-items';
import type { RowMenuLocaleText } from '@lib/constants';
import { getMenuAnchor, isOwnContextMenuTarget, type MenuAnchor } from '@lib/context-menu';
import { MenuItem } from '@mui/material';
import { gridClasses, type DataGridProps, type GridRowId } from '@mui/x-data-grid';
import { useEffect, useState } from 'react';

type RowContextMenuProps = {
  apiRef: NonNullable<DataGridProps['apiRef']>;
  text: RowMenuLocaleText;
  disabled: boolean;
};

type Anchor = MenuAnchor & { id: GridRowId };

const ROW_SELECTOR = `.${gridClasses.row}[data-id]`;

/**
 * Right-clicking a row opens its row menu at the pointer, with or without the menu column. Rendered
 * next to the grid, it listens on the grid root, so pinned rows are covered too; detail panels,
 * nested grids and text fields keep the browser's context menu.
 */
const RowContextMenu = ({ apiRef, text, disabled }: RowContextMenuProps) => {
  const getItems = useRowMenuItems(text);
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  useEffect(() => {
    const root = apiRef.current?.rootElementRef.current;
    if (!root || disabled) {
      return undefined;
    }
    const onContextMenu = (event: MouseEvent) => {
      const target = event.target as Element;
      const rowElement = target.closest<HTMLElement>(ROW_SELECTOR);
      const api = apiRef.current;
      if (!api || !rowElement?.dataset.id || !isOwnContextMenuTarget(target, root)) {
        return;
      }
      // `data-id` is a string; the lookup resolves it back to the row's own (maybe numeric) id.
      const row = api.getRow(rowElement.dataset.id);
      if (!row) {
        return;
      }
      event.preventDefault();
      api.hideColumnMenu();
      setAnchor({ ...getMenuAnchor(event), id: api.getRowId(row) });
      setOpen(true);
    };
    root.addEventListener('contextmenu', onContextMenu);
    return () => root.removeEventListener('contextmenu', onContextMenu);
  }, [apiRef, disabled]);

  return (
    <ContextMenu anchor={anchor} open={open} onClose={close} onExited={() => setAnchor(null)}>
      {anchor &&
        getItems(anchor.id).map(({ label, onClick }) => (
          <MenuItem
            key={label}
            onClick={() => {
              close();
              onClick();
            }}
          >
            {label}
          </MenuItem>
        ))}
    </ContextMenu>
  );
};

export default RowContextMenu;
