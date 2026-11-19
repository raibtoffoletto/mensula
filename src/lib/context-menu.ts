import { CONTEXT_MENU_IGNORED_SELECTOR } from '@lib/constants';
import { gridClasses } from '@mui/x-data-grid';

/** Viewport position a context menu opens at. */
export type MenuAnchor = { top: number; left: number };

/**
 * Whether a right-click on `target` belongs to the grid whose root is `root`: not to a grid nested
 * in a detail panel (which handles its own), and not to a text field (which keeps the browser's
 * menu for copy, paste and spell check).
 */
export const isOwnContextMenuTarget = (target: Element, root: Element) =>
  target.closest(`.${gridClasses.root}`) === root && !target.closest(CONTEXT_MENU_IGNORED_SELECTOR);

/**
 * Where to open the menu: at the pointer, or under the target when the keyboard's context-menu key
 * fired the event (it reports no pointer position).
 */
export const getMenuAnchor = (event: MouseEvent): MenuAnchor => {
  if (event.clientX !== 0 || event.clientY !== 0) {
    return { top: event.clientY, left: event.clientX };
  }
  const rect = (event.target as Element).getBoundingClientRect();
  return { top: rect.bottom, left: rect.left };
};
