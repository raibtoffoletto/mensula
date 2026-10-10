import { styled } from '@mui/material/styles';
import { vars } from '@mui/x-data-grid/internals';

/** Toolbar drop-in: lays its children out in a row, e.g. to keep buttons together on one side. */
const ToolbarGroup = styled('div', { name: 'MuiDataGrid', slot: 'ToolbarGroup' })({
  display: 'flex',
  gap: vars.spacing(1),
  alignItems: 'center',
});

export default ToolbarGroup;
