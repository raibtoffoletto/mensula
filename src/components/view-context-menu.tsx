import ContextMenu from '@components/context-menu';
import { DENSITY_OPTIONS, type ViewMenuLocaleText } from '@lib/constants';
import { getMenuAnchor, isOwnContextMenuTarget, type MenuAnchor } from '@lib/context-menu';
import {
  CellBordersIcon,
  CheckIcon,
  DensityComfortableIcon,
  DensityCompactIcon,
  DensityStandardIcon,
  HeaderBordersIcon,
  type MenuIcon,
} from '@lib/icons';
import { Divider, ListItemIcon, ListItemText, MenuItem } from '@mui/material';
import {
  gridClasses,
  gridDensitySelector,
  type DataGridProps,
  type GridDensity,
  type GridSlotsComponent,
} from '@mui/x-data-grid';
import { useEffect, useState, type ComponentType, type ReactNode } from 'react';

type ViewContextMenuProps = {
  apiRef: NonNullable<DataGridProps['apiRef']>;
  text: ViewMenuLocaleText;
  disabled: boolean;
  /** Leaves the density choices out (the grid's `disableDensitySelector`). */
  hideDensity: boolean;
  /** The grid's `slots`, whose `density*Icon` entries replace the default density icons. */
  slots?: Partial<GridSlotsComponent>;
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
  densityLabels: Record<GridDensity, ReactNode>;
  setDensity: (density: GridDensity) => void;
};

// Toolbar and footer controls (toolbar buttons, pagination, the page size select) keep the
// browser's menu.
const CONTROL_SELECTOR = 'button, a[href], [role="button"], [role="combobox"]';
const BAR_SELECTOR = `.${gridClasses.toolbar}, .${gridClasses.footerContainer}`;

/**
 * The toolbar and the footer, outside their controls, and the parts of the header row that hold no
 * column header: the filler after the last column and the empty cells of column groups.
 */
const isViewMenuArea = (target: Element) => {
  if (target.closest(BAR_SELECTOR)) {
    return !target.closest(CONTROL_SELECTOR);
  }
  if (!target.closest(`.${gridClasses.columnHeaders}`)) {
    return false;
  }
  const header = target.closest(`.${gridClasses.columnHeader}`);
  return !header || header.classList.contains(gridClasses['columnHeader--emptyGroup']);
};

type DensityIconSlot = (typeof DENSITY_OPTIONS)[number]['iconSlot'];

const DEFAULT_DENSITY_ICONS: Record<DensityIconSlot, MenuIcon> = {
  densityCompactIcon: DensityCompactIcon,
  densityStandardIcon: DensityStandardIcon,
  densityComfortableIcon: DensityComfortableIcon,
};

type ViewMenuItemProps = {
  icon: ComponentType<{ fontSize?: 'small' }>;
  label: ReactNode;
  role: 'menuitemradio' | 'menuitemcheckbox';
  checked: boolean;
  onClick: () => void;
};

/**
 * An option's icon on the left and, on the right, a check when it is on. The check keeps its room
 * when off, so the labels and checks line up.
 */
const ViewMenuItem = ({ icon: Icon, label, role, checked, onClick }: ViewMenuItemProps) => (
  <MenuItem role={role} aria-checked={checked} onClick={onClick}>
    <ListItemIcon>
      <Icon fontSize="small" />
    </ListItemIcon>
    <ListItemText>{label}</ListItemText>
    <CheckIcon fontSize="small" sx={{ ml: 2, visibility: checked ? 'visible' : 'hidden' }} />
  </MenuItem>
);

/**
 * Right-clicking the toolbar, the footer or the empty part of the header row opens the view menu: the grid's
 * density and its vertical borders. Like the row menu, it listens on the grid root.
 */
const ViewContextMenu = ({
  apiRef,
  text,
  disabled,
  hideDensity,
  slots,
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
      ...DENSITY_OPTIONS.map(({ density, iconSlot }) => (
        <ViewMenuItem
          key={density}
          icon={slots?.[iconSlot] ?? DEFAULT_DENSITY_ICONS[iconSlot]}
          label={anchor.densityLabels[density]}
          role="menuitemradio"
          checked={anchor.density === density}
          onClick={select(() => anchor.setDensity(density))}
        />
      )),
      <Divider key="divider" />,
    );
  }
  if (anchor) {
    const borders = [
      {
        icon: CellBordersIcon,
        label: text.viewMenuCellBorders,
        checked: showCellVerticalBorder,
        toggle: () => setShowCellVerticalBorder(!showCellVerticalBorder),
      },
      {
        icon: HeaderBordersIcon,
        label: text.viewMenuHeaderBorders,
        checked: showColumnVerticalBorder,
        toggle: () => setShowColumnVerticalBorder(!showColumnVerticalBorder),
      },
    ];
    items.push(
      ...borders.map(({ icon, label, checked, toggle }) => (
        <ViewMenuItem
          key={label}
          icon={icon}
          label={label}
          role="menuitemcheckbox"
          checked={checked}
          onClick={select(toggle)}
        />
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
