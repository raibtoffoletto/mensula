import RowHighlightContext from '@contexts/row-highlight';
import { useContext } from 'react';

/** Reads and drives row highlighting from inside the grid — custom row menus, cells, toolbars. */
const useRowHighlight = () => {
  const context = useContext(RowHighlightContext);
  if (!context) {
    throw new Error('tablewright: row highlight hooks must be used inside a TableWright.');
  }
  return context;
};

export default useRowHighlight;
