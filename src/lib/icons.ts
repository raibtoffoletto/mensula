import { createSvgIcon } from '@mui/material/utils';
import { createElement } from 'react';

// Material "push_pin" glyph, its head leaning toward the side it pins to (DataGridPro ships
// similar icons, but the community package does not).
const pushPin =
  'M16 9V4h1c.55 0 1-.45 1-1s-.45-1-1-1H7c-.55 0-1 .45-1 1s.45 1 1 1h1v5c0 1.66-1.34 3-3 3v2h5.97v7l1 1 1-1v-7H19v-2c-1.66 0-3-1.34-3-3';

export const PinLeftIcon = createSvgIcon(
  createElement('path', { d: pushPin, transform: 'rotate(-30 12 12)' }),
  'PinLeft',
);

export const PinRightIcon = createSvgIcon(
  createElement('path', { d: pushPin, transform: 'rotate(30 12 12)' }),
  'PinRight',
);

// Material "check" glyph, marking the chosen options in the view menu.
export const CheckIcon = createSvgIcon(
  createElement('path', { d: 'M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z' }),
  'Check',
);

// Material Symbols "keep_off" (filled): unpins a row or a column. Symbols draw on a 960-unit
// viewBox from y = -960, so the glyph is scaled into the 24-unit box.
export const UnpinIcon = createSvgIcon(
  createElement(
    'g',
    { transform: 'translate(0 24) scale(0.025)' },
    createElement('path', {
      d: 'M680-840v80h-40v327L313-760l-33-33v-47h400ZM480-40l-40-40v-240H240v-80l80-80v-46L56-792l56-56 736 736-58 56-264-264h-6v240l-40 40Z',
    }),
  ),
  'Unpin',
);

// Material "vertical_align_top" / "vertical_align_bottom": pin a row to the top or the bottom.
export const PinToTopIcon = createSvgIcon(
  createElement('path', { d: 'M8 11h3v10h2V11h3l-4-4zM4 3v2h16V3z' }),
  'PinToTop',
);

export const PinToBottomIcon = createSvgIcon(
  createElement('path', { d: 'M16 13h-3V3h-2v10H8l4 4zM4 19v2h16v-2z' }),
  'PinToBottom',
);

// Material "highlight": toggles a row's highlight.
export const HighlightIcon = createSvgIcon(
  createElement('path', {
    d: 'm6 14 3 3v5h6v-5l3-3V9H6zm5-12h2v3h-2zM3.5 5.88l1.41-1.41 2.12 2.12L5.62 8zm13.46.71 2.12-2.12 1.41 1.41L18.38 8z',
  }),
  'Highlight',
);

// Material "content_copy": copies a cell's value.
export const CopyIcon = createSvgIcon(
  createElement('path', {
    d: 'M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2m0 16H8V7h11z',
  }),
  'Copy',
);

// Material "copy_all": copies a whole row.
export const CopyAllIcon = createSvgIcon(
  createElement('path', {
    d: 'M18 2H9c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h9c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2m0 14H9V4h9zM3 15v-2h2v2zm0-5.5h2v2H3zM10 20h2v2h-2zm-7-1.5v-2h2v2zM5 22c-1.1 0-2-.9-2-2h2zm3.5 0h-2v-2h2zm5 0v-2h2c0 1.1-.9 2-2 2M5 6v2H3c0-1.1.9-2 2-2z',
  }),
  'CopyAll',
);

// Material Symbols "block", turned 90° clockwise: clears a sort. Scaled from the Symbols' 960-unit
// viewBox like `UnpinIcon`, then rotated about the 24-unit box's center.
export const UnsortIcon = createSvgIcon(
  createElement(
    'g',
    { transform: 'rotate(90 12 12) translate(0 24) scale(0.025)' },
    createElement('path', {
      d: 'M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q54 0 104-17.5t92-50.5L228-676q-33 42-50.5 92T160-480q0 134 93 227t227 93Zm252-124q33-42 50.5-92T800-480q0-134-93-227t-227-93q-54 0-104 17.5T284-732l448 448Z',
    }),
  ),
  'Unsort',
);

/** An icon made with `createSvgIcon`, for menu items to render. */
export type MenuIcon = typeof CopyIcon;

// The grid's density icons (Material "view_headline", "table_rows", "view_stream"), which the
// community package keeps private. The view menu falls back to them when the `density*Icon`
// slots are not set.
export const DensityCompactIcon = createSvgIcon(
  createElement('path', { d: 'M4 15h16v-2H4zm0 4h16v-2H4zm0-8h16V9H4zm0-6v2h16V5z' }),
  'DensityCompact',
);

export const DensityStandardIcon = createSvgIcon(
  createElement('path', { d: 'M21 8H3V4h18zm0 2H3v4h18zm0 6H3v4h18z' }),
  'DensityStandard',
);

export const DensityComfortableIcon = createSvgIcon(
  createElement('path', { d: 'M4 18h17v-6H4zM4 5v6h17V5z' }),
  'DensityComfortable',
);

// Material "border_inner": toggles the cell vertical borders.
export const CellBordersIcon = createSvgIcon(
  createElement('path', {
    d: 'M3 21h2v-2H3zm4 0h2v-2H7zM5 7H3v2h2zM3 17h2v-2H3zM9 3H7v2h2zM5 3H3v2h2zm12 0h-2v2h2zm2 6h2V7h-2zm0-6v2h2V3zm-4 18h2v-2h-2zM13 3h-2v8H3v2h8v8h2v-8h8v-2h-8zm6 18h2v-2h-2zm0-4h2v-2h-2z',
  }),
  'CellBorders',
);

// Material "border_vertical": toggles the header vertical borders.
export const HeaderBordersIcon = createSvgIcon(
  createElement('path', {
    d: 'M3 9h2V7H3zm0-4h2V3H3zm4 16h2v-2H7zm0-8h2v-2H7zm-4 0h2v-2H3zm0 8h2v-2H3zm0-4h2v-2H3zM7 5h2V3H7zm12 12h2v-2h-2zm-8 4h2V3h-2zm8 0h2v-2h-2zm0-8h2v-2h-2zm0-10v2h2V3zm0 6h2V7h-2zm-4-4h2V3h-2zm0 16h2v-2h-2zm0-8h2v-2h-2z',
  }),
  'HeaderBorders',
);
