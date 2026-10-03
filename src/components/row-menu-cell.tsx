import useRowMenuItems from '@hooks/use-row-menu-items';
import useRowMenuLocaleText from '@hooks/use-row-menu-locale-text';
import { GridActionsCell, GridActionsCellItem, type GridRenderCellParams } from '@mui/x-data-grid';

/** Default `renderCell` of the row menu column: a "more" button opening the grid's actions menu. */
const RowMenuCell = (params: GridRenderCellParams) => {
  const items = useRowMenuItems(useRowMenuLocaleText())(params.id);

  return (
    <GridActionsCell {...params}>
      {items.map(({ label, onClick }) => (
        <GridActionsCellItem key={label} label={label} showInMenu onClick={onClick} />
      ))}
    </GridActionsCell>
  );
};

export default RowMenuCell;
