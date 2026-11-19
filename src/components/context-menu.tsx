import type { MenuAnchor } from '@lib/context-menu';
import { Menu } from '@mui/material';
import type { MouseEvent } from 'react';

type ContextMenuProps = Parent<{
  /** Kept after `open` turns false, so the items stay put while the menu fades out. */
  anchor: MenuAnchor | null;
  open: boolean;
  onClose: () => void;
  /** Fired once the menu has faded out: the moment to drop the anchor. */
  onExited: () => void;
}>;

/** A menu opened at the pointer by a right-click on the grid. */
const ContextMenu = ({ anchor, open, onClose, onExited, children }: ContextMenuProps) => (
  <Menu
    open={open && anchor !== null}
    onClose={onClose}
    anchorReference="anchorPosition"
    anchorPosition={anchor ?? undefined}
    slotProps={{
      // Right-clicking the backdrop dismisses the menu rather than stacking the browser's on it.
      root: {
        onContextMenu: (event: MouseEvent<HTMLDivElement>) => {
          event.preventDefault();
          onClose();
        },
      },
      transition: { onExited },
    }}
  >
    {children}
  </Menu>
);

export default ContextMenu;
