import type { GridRowId, GridRowProps } from '@mui/x-data-grid';
import { createContext, type JSXElementConstructor, type ReactNode } from 'react';

/** Public surface of the master-detail feature, returned by `useDetailPanel()`. */
export type DetailPanelApi = {
  /** Rows whose detail panel is open. */
  expandedRowIds: ReadonlySet<GridRowId>;
  /** Expands or collapses the detail panel of a row. Rows without content are ignored. */
  toggleDetailPanel: (id: GridRowId) => void;
  /** Replaces the set of expanded rows. */
  setExpandedDetailPanels: (ids: Set<GridRowId>) => void;
  /** Whether `getDetailPanelContent` returns content for the row. */
  hasDetailPanel: (id: GridRowId) => boolean;
};

export type DetailPanelContextValue = DetailPanelApi & {
  getDetailPanelContent: (id: GridRowId) => ReactNode;
  getDetailPanelHeight: (id: GridRowId) => number | 'auto';
  /** Height currently reserved below the row (measured height for `'auto'` panels). */
  getReservedHeight: (id: GridRowId) => number;
  reportDetailPanelHeight: (id: GridRowId, height: number) => void;
  /** Row slot the consumer passed in (or `GridRow`), rendered above each panel. */
  rowSlot: JSXElementConstructor<GridRowProps>;
};

const DetailPanelContext = createContext<DetailPanelContextValue | null>(null);

export default DetailPanelContext;
