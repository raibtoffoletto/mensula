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
export const ROW_HIGHLIGHTED_CLASS = 'TableWright-row--highlighted';

/** Right-clicks on these keep the browser's context menu (copy, paste, spell check). */
export const CONTEXT_MENU_IGNORED_SELECTOR =
  'input, textarea, select, [contenteditable=""], [contenteditable="true"]';

/** Labels of the row menu. Translate them through `localeText`, next to the grid's own keys. */
export type RowMenuLocaleText = {
  rowMenuHeaderLabel: string;
  rowMenuPinToTop: string;
  rowMenuPinToBottom: string;
  rowMenuUnpin: string;
  rowMenuHighlight: string;
  rowMenuRemoveHighlight: string;
};

export const ROW_MENU_LOCALE_TEXT: RowMenuLocaleText = {
  rowMenuHeaderLabel: 'Row menu',
  rowMenuPinToTop: 'Pin to top',
  rowMenuPinToBottom: 'Pin to bottom',
  rowMenuUnpin: 'Unpin',
  rowMenuHighlight: 'Highlight',
  rowMenuRemoveHighlight: 'Remove highlight',
};
