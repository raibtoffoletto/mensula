import ContextMenu from '@components/context-menu';
import useRowMenuItems, { type RowMenuItem } from '@hooks/use-row-menu-items';
import { copyToClipboard, getCellText, getRowText, isDataColumn } from '@lib/clipboard';
import type { RowMenuLocaleText } from '@lib/constants';
import { getMenuAnchor, isOwnContextMenuTarget, type MenuAnchor } from '@lib/context-menu';
import { CopyAllIcon, CopyIcon } from '@lib/icons';
import { Divider, ListItemIcon, ListItemText, MenuItem } from '@mui/material';
import { gridClasses, type DataGridProps, type GridRowId } from '@mui/x-data-grid';
import { useEffect, useState, type ReactNode } from 'react';

type RowContextMenuProps = {
  apiRef: NonNullable<DataGridProps['apiRef']>;
  text: RowMenuLocaleText;
  disabled: boolean;
};

/**
 * The copy actions are bound to the grid API when the menu opens (the API is a ref, which rendering
 * must not read). `copyValue` is null unless the right-click landed on a data cell.
 */
type Anchor = MenuAnchor & {
  id: GridRowId;
  copyValue: (() => void) | null;
  copyRow: () => void;
};

const ROW_SELECTOR = `.${gridClasses.row}[data-id]`;
const CELL_SELECTOR = `.${gridClasses.cell}[data-field]`;

/**
 * Right-clicking a row opens its row menu at the pointer, with or without the menu column, under
 * the copy items the browser's menu would have offered. Rendered next to the grid, it listens on
 * the grid root, so pinned rows are covered too; detail panels, nested grids and text fields keep
 * the browser's context menu.
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
      const id = api.getRowId(row);
      const field = target.closest<HTMLElement>(CELL_SELECTOR)?.dataset.field;
      const column = field ? api.getColumn(field) : undefined;
      event.preventDefault();
      api.hideColumnMenu();
      setAnchor({
        ...getMenuAnchor(event),
        id,
        copyValue:
          column && isDataColumn(column)
            ? () => copyToClipboard(getCellText(api, id, column.field))
            : null,
        copyRow: () => copyToClipboard(getRowText(api, id)),
      });
      setOpen(true);
    };
    root.addEventListener('contextmenu', onContextMenu);
    return () => root.removeEventListener('contextmenu', onContextMenu);
  }, [apiRef, disabled]);

  const renderItem = ({ label, icon: Icon, onClick }: RowMenuItem) => (
    <MenuItem
      key={label}
      onClick={() => {
        close();
        onClick();
      }}
    >
      <ListItemIcon>
        <Icon fontSize="small" />
      </ListItemIcon>
      <ListItemText>{label}</ListItemText>
    </MenuItem>
  );

  // Flat children: the menu's keyboard navigation does not look inside fragments.
  const items: ReactNode[] = [];
  if (anchor) {
    const { id, copyValue, copyRow } = anchor;
    const copyItems: RowMenuItem[] = [
      ...(copyValue ? [{ label: text.rowMenuCopyValue, icon: CopyIcon, onClick: copyValue }] : []),
      { label: text.rowMenuCopyRow, icon: CopyAllIcon, onClick: copyRow },
    ];
    items.push(
      ...copyItems.map(renderItem),
      <Divider key="copy-divider" />,
      ...getItems(id).map(renderItem),
    );
  }

  return (
    <ContextMenu anchor={anchor} open={open} onClose={close} onExited={() => setAnchor(null)}>
      {items}
    </ContextMenu>
  );
};

export default RowContextMenu;
