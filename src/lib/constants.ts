import type { GridDensity, GridLocaleText, GridSlotsComponent } from '@mui/x-data-grid';

export const PinnedColumnSide = {
  Left: 'left',
  Right: 'right',
} as const;

export type PinnedColumnSide = (typeof PinnedColumnSide)[keyof typeof PinnedColumnSide];

export const PinnedRowPosition = {
  Top: 'top',
  Bottom: 'bottom',
} as const;

export type PinnedRowPosition = (typeof PinnedRowPosition)[keyof typeof PinnedRowPosition];

/** Class added to highlighted rows; style it through the grid's `sx` to change the look. */
export const ROW_HIGHLIGHTED_CLASS = 'Mensula-row--highlighted';

/** Right-clicks on these keep the browser's context menu (copy, paste, spell check). */
export const CONTEXT_MENU_IGNORED_SELECTOR =
  'input, textarea, select, [contenteditable=""], [contenteditable="true"]';

/** Labels of the row menu. Translate them through `localeText`, next to the grid's own keys. */
export type RowMenuLocaleText = {
  rowMenuHeaderLabel: string;
  /** Right-click menu only: copies the clicked cell's value. */
  rowMenuCopyValue: string;
  /** Right-click menu only: copies every column of the row as `Header: value` lines. */
  rowMenuCopyRow: string;
  rowMenuPinToTop: string;
  rowMenuPinToBottom: string;
  rowMenuUnpin: string;
  rowMenuHighlight: string;
  rowMenuRemoveHighlight: string;
};

export const ROW_MENU_LOCALE_TEXT: RowMenuLocaleText = {
  rowMenuHeaderLabel: 'Row menu',
  rowMenuCopyValue: 'Copy value',
  rowMenuCopyRow: 'Copy row',
  rowMenuPinToTop: 'Pin to top',
  rowMenuPinToBottom: 'Pin to bottom',
  rowMenuUnpin: 'Unpin',
  rowMenuHighlight: 'Highlight',
  rowMenuRemoveHighlight: 'Remove highlight',
};

/**
 * Labels of the view menu (right-click the footer or the empty part of the header row). Translate
 * them through `localeText`; the density items use the grid's own `toolbarDensity*` keys.
 */
export type ViewMenuLocaleText = {
  viewMenuCellBorders: string;
  viewMenuHeaderBorders: string;
};

export const VIEW_MENU_LOCALE_TEXT: ViewMenuLocaleText = {
  viewMenuCellBorders: 'Cell borders',
  viewMenuHeaderBorders: 'Header borders',
};

/**
 * The view menu's density choices, in order, each with the grid's locale key for its label and the
 * grid slot for its icon.
 */
export const DENSITY_OPTIONS = [
  { density: 'compact', labelKey: 'toolbarDensityCompact', iconSlot: 'densityCompactIcon' },
  { density: 'standard', labelKey: 'toolbarDensityStandard', iconSlot: 'densityStandardIcon' },
  {
    density: 'comfortable',
    labelKey: 'toolbarDensityComfortable',
    iconSlot: 'densityComfortableIcon',
  },
] as const satisfies ReadonlyArray<{
  density: GridDensity;
  labelKey: keyof GridLocaleText;
  iconSlot: keyof GridSlotsComponent;
}>;
