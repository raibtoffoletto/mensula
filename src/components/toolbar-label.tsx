import { styled } from '@mui/material/styles';
import { gridClasses, useGridRootProps } from '@mui/x-data-grid';
import { vars } from '@mui/x-data-grid/internals';

const Label = styled('span', { name: 'MuiDataGrid', slot: 'ToolbarLabel' })({
  font: vars.typography.font.large,
  fontWeight: vars.typography.fontWeight.medium,
  margin: vars.spacing(0, 0.5),
  textOverflow: 'ellipsis',
  overflow: 'hidden',
  whiteSpace: 'nowrap',
});

/** Toolbar drop-in: the grid's `label`, or `children` in its place. */
const ToolbarLabel = ({ children }: Parent) => {
  const { label } = useGridRootProps();
  return <Label className={gridClasses.toolbarLabel}>{children ?? label}</Label>;
};

export default ToolbarLabel;
