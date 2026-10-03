import ColumnMenuPinningItem from '@components/column-menu-pinning-item';
import { GridColumnMenu, type GridColumnMenuProps } from '@mui/x-data-grid';

/** Default `columnMenu` slot: the community menu plus pinning items (between sort and filter). */
const ColumnMenu = ({ slots, slotProps, ...props }: GridColumnMenuProps) => (
  <GridColumnMenu
    {...props}
    slots={{ columnMenuPinningItem: ColumnMenuPinningItem, ...slots }}
    slotProps={{ columnMenuPinningItem: { displayOrder: 15 }, ...slotProps }}
  />
);

export default ColumnMenu;
