import type { GridPinnedColumnFields, GridRowEntry, GridValidRowModel } from '@mui/x-data-grid';
import type { PinnedColumnSide } from '@lib/constants';
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

export type PinningContextValue = ColumnPinningApi & {
  disableColumnPinning: boolean;
  pinnedRows: { top: GridRowEntry[]; bottom: GridRowEntry[] };
};

const PinningContext = createContext<PinningContextValue | null>(null);

export default PinningContext;
