import type { DetailPanelApi } from '@contexts/detail-panel';
import useDetailPanelContext from '@hooks/use-detail-panel-context';

/**
 * Reads and drives the master-detail state from inside the grid — custom toggle cells,
 * "expand all" headers, buttons rendered in a detail panel, etc.
 */
const useDetailPanel = (): DetailPanelApi => {
  const { expandedRowIds, toggleDetailPanel, setExpandedDetailPanels, hasDetailPanel } =
    useDetailPanelContext();
  return { expandedRowIds, toggleDetailPanel, setExpandedDetailPanels, hasDetailPanel };
};

export default useDetailPanel;
