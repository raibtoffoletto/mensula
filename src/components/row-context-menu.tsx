import useRowMenuItems from '@hooks/use-row-menu-items';
import { CONTEXT_MENU_IGNORED_SELECTOR, type RowMenuLocaleText } from '@lib/constants';
import { Menu, MenuItem } from '@mui/material';
import { gridClasses, type DataGridProps, type GridRowId } from '@mui/x-data-grid';
import { useEffect, useState, type MouseEvent as ReactMouseEvent } from 'react';

type RowContextMenuProps = {
  apiRef: NonNullable<DataGridProps['apiRef']>;
  text: RowMenuLocaleText;
  disabled: boolean;
};

type Anchor = { id: GridRowId; top: number; left: number };

const ROW_SELECTOR = `.${gridClasses.row}[data-id]`;

/**
 * Right-clicking a row opens its row menu at the pointer, with or without the menu column. Rendered
 * next to the grid, it listens on the grid root, so pinned rows are covered too; detail panels,
 * nested grids and text fields keep the browser's context menu.
 */
const RowContextMenu = ({ apiRef, text, disabled }: RowContextMenuProps) => {
  const getItems = useRowMenuItems(text);
  // The anchor outlives `open` so the items stay put while the menu fades out.
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
      if (
        !api ||
        !rowElement?.dataset.id ||
        rowElement.closest(`.${gridClasses.root}`) !== root ||
        target.closest(CONTEXT_MENU_IGNORED_SELECTOR)
      ) {
        return;
      }
      // `data-id` is a string; the lookup resolves it back to the row's own (maybe numeric) id.
      const row = api.getRow(rowElement.dataset.id);
      if (!row) {
        return;
      }
      event.preventDefault();
      api.hideColumnMenu();
      // The context-menu key reports no pointer position: open under the focused cell instead.
      const fromKeyboard = event.clientX === 0 && event.clientY === 0;
      const rect = target.getBoundingClientRect();
      setAnchor({
        id: api.getRowId(row),
        top: fromKeyboard ? rect.bottom : event.clientY,
        left: fromKeyboard ? rect.left : event.clientX,
      });
      setOpen(true);
    };
    root.addEventListener('contextmenu', onContextMenu);
    return () => root.removeEventListener('contextmenu', onContextMenu);
  }, [apiRef, disabled]);

  return (
    <Menu
      open={open && anchor !== null}
      onClose={close}
      anchorReference="anchorPosition"
      anchorPosition={anchor ?? undefined}
      slotProps={{
        // Right-clicking the backdrop dismisses the menu rather than stacking the browser's on it.
        root: {
          onContextMenu: (event: ReactMouseEvent<HTMLDivElement>) => {
            event.preventDefault();
            close();
          },
        },
        transition: { onExited: () => setAnchor(null) },
      }}
    >
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
    </Menu>
  );
};

export default RowContextMenu;
