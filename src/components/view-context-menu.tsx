import ContextMenu from '@components/context-menu';
import { DENSITY_OPTIONS, type ViewMenuLocaleText } from '@lib/constants';
import { getMenuAnchor, isOwnContextMenuTarget, type MenuAnchor } from '@lib/context-menu';
import { CheckIcon } from '@lib/icons';
import { Divider, ListItemIcon, ListItemText, ListSubheader, MenuItem } from '@mui/material';
import {
  gridClasses,
  gridDensitySelector,
  type DataGridProps,
  type GridDensity,
} from '@mui/x-data-grid';
import { useEffect, useState, type ReactNode } from 'react';

type ViewContextMenuProps = {
  apiRef: NonNullable<DataGridProps['apiRef']>;
  text: ViewMenuLocaleText;
  disabled: boolean;
  /** Leaves the density choices out (the grid's `disableDensitySelector`). */
  hideDensity: boolean;
  showCellVerticalBorder: boolean;
  setShowCellVerticalBorder: (show: boolean) => void;
  showColumnVerticalBorder: boolean;
  setShowColumnVerticalBorder: (show: boolean) => void;
};

/**
 * The grid owns the density and its labels, so the menu reads them when it opens (the grid API is
 * a ref, which rendering must not read).
 */
type Anchor = MenuAnchor & {
  density: GridDensity;
  densityTitle: ReactNode;
  densityLabels: Record<GridDensity, ReactNode>;
  setDensity: (density: GridDensity) => void;
};

// Footer controls (pagination buttons, the page size select) keep the browser's menu.
const FOOTER_CONTROL_SELECTOR = 'button, a[href], [role="button"], [role="combobox"]';

/**
 * The footer, outside its controls, and the parts of the header row that hold no column header:
 * the filler after the last column and the empty cells of column groups.
 */
const isViewMenuArea = (target: Element) => {
  if (target.closest(`.${gridClasses.footerContainer}`)) {
    return !target.closest(FOOTER_CONTROL_SELECTOR);
  }
  if (!target.closest(`.${gridClasses.columnHeaders}`)) {
    return false;
  }
  const header = target.closest(`.${gridClasses.columnHeader}`);
  return !header || header.classList.contains(gridClasses['columnHeader--emptyGroup']);
};

const Check = ({ checked }: { checked: boolean }) => (
  <ListItemIcon>{checked && <CheckIcon fontSize="small" />}</ListItemIcon>
);

/**
 * Right-clicking the footer or the empty part of the header row opens the view menu: the grid's
 * density and its vertical borders. Like the row menu, it listens on the grid root.
 */
const ViewContextMenu = ({
  apiRef,
  text,
  disabled,
  hideDensity,
  showCellVerticalBorder,
  setShowCellVerticalBorder,
  showColumnVerticalBorder,
  setShowColumnVerticalBorder,
}: ViewContextMenuProps) => {
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
      const api = apiRef.current;
      if (!api || !isOwnContextMenuTarget(target, root) || !isViewMenuArea(target)) {
        return;
      }
      event.preventDefault();
      api.hideColumnMenu();
      setAnchor({
        ...getMenuAnchor(event),
        density: gridDensitySelector(apiRef),
        densityTitle: api.getLocaleText('toolbarDensity'),
        densityLabels: Object.fromEntries(
          DENSITY_OPTIONS.map(({ density, labelKey }) => [density, api.getLocaleText(labelKey)]),
        ) as Record<GridDensity, ReactNode>,
        setDensity: api.setDensity,
      });
      setOpen(true);
    };
    root.addEventListener('contextmenu', onContextMenu);
    return () => root.removeEventListener('contextmenu', onContextMenu);
  }, [apiRef, disabled]);

  const select = (action: () => void) => () => {
    close();
    action();
  };

  // Flat children: the menu's keyboard navigation does not look inside fragments.
  const items: ReactNode[] = [];
  if (anchor && !hideDensity) {
    items.push(
      <ListSubheader key="density">{anchor.densityTitle}</ListSubheader>,
      ...DENSITY_OPTIONS.map(({ density }) => (
        <MenuItem
          key={density}
          role="menuitemradio"
          aria-checked={anchor.density === density}
          onClick={select(() => anchor.setDensity(density))}
        >
          <Check checked={anchor.density === density} />
          <ListItemText>{anchor.densityLabels[density]}</ListItemText>
        </MenuItem>
      )),
      <Divider key="divider" />,
    );
  }
  if (anchor) {
    const borders = [
      {
        label: text.viewMenuCellBorders,
        checked: showCellVerticalBorder,
        toggle: () => setShowCellVerticalBorder(!showCellVerticalBorder),
      },
      {
        label: text.viewMenuHeaderBorders,
        checked: showColumnVerticalBorder,
        toggle: () => setShowColumnVerticalBorder(!showColumnVerticalBorder),
      },
    ];
    items.push(
      ...borders.map(({ label, checked, toggle }) => (
        <MenuItem
          key={label}
          role="menuitemcheckbox"
          aria-checked={checked}
          onClick={select(toggle)}
        >
          <Check checked={checked} />
          <ListItemText>{label}</ListItemText>
        </MenuItem>
      )),
    );
  }

  return (
    <ContextMenu anchor={anchor} open={open} onClose={close} onExited={() => setAnchor(null)}>
      {items}
    </ContextMenu>
  );
};

export default ViewContextMenu;
