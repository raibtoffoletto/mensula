import type { GridRowId } from '@mui/x-data-grid';
import { createContext } from 'react';

/** Public surface of row highlighting, returned by `useRowHighlight()`. */
export type RowHighlightApi = {
  /** Rows currently highlighted. */
  highlightedRowIds: ReadonlySet<GridRowId>;
  /** Replaces the set of highlighted rows. */
  setHighlightedRowIds: (ids: Set<GridRowId>) => void;
  /** Highlights the row, or removes its highlight. */
  toggleRowHighlight: (id: GridRowId) => void;
  isRowHighlighted: (id: GridRowId) => boolean;
};

const RowHighlightContext = createContext<RowHighlightApi | null>(null);

export default RowHighlightContext;
