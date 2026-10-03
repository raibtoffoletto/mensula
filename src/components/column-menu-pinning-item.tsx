import usePinningContext from '@hooks/use-pinning-context';
import { PinnedColumnSide } from '@lib/constants';
import { PinLeftIcon, PinRightIcon } from '@lib/icons';
import { useGridRootProps, type GridColumnMenuItemProps } from '@mui/x-data-grid';
import type { MouseEvent, ReactNode } from 'react';

/**
 * Column menu item with "Pin to left" / "Pin to right" / "Unpin", in DataGridPro's order.
 * Included in TableWright's default column menu; add it to a custom menu as
 * `slots={{ columnMenuPinningItem: ColumnMenuPinningItem }}`.
 */
const ColumnMenuPinningItem = ({ colDef, onClick }: GridColumnMenuItemProps) => {
  const { slots, localeText } = useGridRootProps();
  const { disableColumnPinning, isColumnPinned, pinColumn, unpinColumn } = usePinningContext();

  if (disableColumnPinning || colDef.pinnable === false) {
    return null;
  }

  const side = isColumnPinned(colDef.field);
  const item = (label: string, action: () => void, icon?: ReactNode) => (
    <slots.baseMenuItem
      key={label}
      iconStart={icon}
      onClick={(event: MouseEvent<HTMLElement>) => {
        action();
        onClick(event);
      }}
    >
      {label}
    </slots.baseMenuItem>
  );
  const pinLeft = item(
    localeText.pinToLeft,
    () => pinColumn(colDef.field, PinnedColumnSide.Left),
    <PinLeftIcon fontSize="small" />,
  );
  const pinRight = item(
    localeText.pinToRight,
    () => pinColumn(colDef.field, PinnedColumnSide.Right),
    <PinRightIcon fontSize="small" />,
  );
  const unpin = item(localeText.unpin, () => unpinColumn(colDef.field));

  if (side === PinnedColumnSide.Left) {
    return [unpin, pinRight];
  }
  if (side === PinnedColumnSide.Right) {
    return [pinLeft, unpin];
  }
  return [pinLeft, pinRight];
};

export default ColumnMenuPinningItem;
