import useDetailPanel from '@hooks/use-detail-panel';
import { IconButton } from '@mui/material';
import { useGridRootProps, type GridRenderCellParams } from '@mui/x-data-grid';

/**
 * Default `renderCell` of the toggle column: a +/− button, disabled for rows without content and
 * absent on pinned rows.
 */
const DetailPanelToggleCell = ({ id, hasFocus, rowNode }: GridRenderCellParams) => {
  const { slots, localeText } = useGridRootProps();
  const { expandedRowIds, toggleDetailPanel, hasDetailPanel } = useDetailPanel();
  const isExpanded = expandedRowIds.has(id);
  const Icon = isExpanded ? slots.detailPanelCollapseIcon : slots.detailPanelExpandIcon;

  if (rowNode.type === 'pinnedRow') {
    return null;
  }

  return (
    <IconButton
      size="small"
      tabIndex={hasFocus ? 0 : -1}
      disabled={!hasDetailPanel(id)}
      aria-expanded={isExpanded}
      aria-label={isExpanded ? localeText.collapseDetailPanel : localeText.expandDetailPanel}
      onClick={() => toggleDetailPanel(id)}
    >
      <Icon fontSize="inherit" />
    </IconButton>
  );
};

export default DetailPanelToggleCell;
