import type {
  GridPinnedColumnFields,
  GridRowEntry,
  GridRowId,
  GridValidRowModel,
} from '@mui/x-data-grid';
import type { PinnedColumnSide, PinnedRowPosition } from '@lib/constants';
import { createContext } from 'react';

/** Rows rendered above (`top`) or below (`bottom`) the scrollable rows, like `DataGridPro`. */
export type PinnedRowsProp<R extends GridValidRowModel = GridValidRowModel> = {
  top?: R[];
  bottom?: R[];
};

/** Public surface of column pinning, returned by `useColumnPinning()`. */
export type ColumnPinningApi = {
  pinnedColumns: GridPinnedColumnFields;
  setPinnedColumns: (pinnedColumns: GridPinnedColumnFields) => void;
  pinColumn: (field: string, side: PinnedColumnSide) => void;
  unpinColumn: (field: string) => void;
  /** Side the column is pinned to, or `false`. */
  isColumnPinned: (field: string) => PinnedColumnSide | false;
};

/** Public surface of row pinning, returned by `useRowPinning()`. */
export type RowPinningApi = {
  pinnedRows: PinnedRowsProp;
  setPinnedRows: (pinnedRows: PinnedRowsProp) => void;
  /**
   * Pins a row next to the scrolling rows: last of the top section, first of the bottom one.
   * Pinning to the other section moves the row.
   */
  pinRow: (id: GridRowId, position: PinnedRowPosition) => void;
  unpinRow: (id: GridRowId) => void;
  /** Section the row is pinned to, or `false`. */
  isRowPinned: (id: GridRowId) => PinnedRowPosition | false;
};

export type PinningContextValue = ColumnPinningApi &
  RowPinningApi & {
    disableColumnPinning: boolean;
    pinnedRowEntries: { top: GridRowEntry[]; bottom: GridRowEntry[] };
    /** Whether the row is also in `rows`, so unpinning returns it to the scrolling rows. */
    isRowInRows: (id: GridRowId) => boolean;
  };

const PinningContext = createContext<PinningContextValue | null>(null);

export default PinningContext;
