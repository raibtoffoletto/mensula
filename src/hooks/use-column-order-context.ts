import ColumnOrderContext from '@contexts/column-order';
import { useContext } from 'react';

/** Internal: full column-order context, including what drags and the grid-side sync need. */
const useColumnOrderContext = () => {
  const context = useContext(ColumnOrderContext);
  if (!context) {
    throw new Error('mensula: column reorder hooks must be used inside a Mensula.');
  }
  return context;
};

export default useColumnOrderContext;
