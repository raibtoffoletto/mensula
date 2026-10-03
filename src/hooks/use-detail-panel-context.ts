import DetailPanelContext from '@contexts/detail-panel';
import { useContext } from 'react';

/** Internal: full context, including what the row and panel slots need. */
const useDetailPanelContext = () => {
  const context = useContext(DetailPanelContext);
  if (!context) {
    throw new Error(
      'tablewright: detail panel hooks must be used inside a TableWright with `getDetailPanelContent`.',
    );
  }
  return context;
};

export default useDetailPanelContext;
