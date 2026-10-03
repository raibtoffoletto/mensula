import type { DetailPanelContextValue } from '@contexts/detail-panel';
import { DEFAULT_DETAIL_PANEL_HEIGHT } from '@lib/detail-panel';
import {
  GridRow,
  type DataGridProps,
  type GridRowId,
  type GridRowParams,
  type GridRowSpacingParams,
  type GridValidRowModel,
} from '@mui/x-data-grid';
import { useCallback, useMemo, useState, type ReactNode } from 'react';

/** Master-detail props, mirroring `DataGridPro`. */
// `any` default matches `DataGridProps<R = any>`, so callbacks typed with a concrete row model
// (`GridRowParams<Person>`) stay assignable.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DetailPanelProps<R extends GridValidRowModel = any> = {
  /**
   * Content rendered below an expanded row. Return `null`/`undefined` for rows without a panel;
   * their toggle is disabled. Memoize it: content is cached per row until this reference changes.
   */
  getDetailPanelContent?: (params: GridRowParams<R>) => ReactNode;
  /** Panel height in pixels, or `'auto'` to size it to its content. Defaults to 500. Memoize it. */
  getDetailPanelHeight?: (params: GridRowParams<R>) => number | 'auto';
  /** Controlled set of expanded rows. */
  detailPanelExpandedRowIds?: Set<GridRowId>;
  /** Fired when a row is expanded or collapsed. */
  onDetailPanelExpandedRowIdsChange?: (ids: Set<GridRowId>) => void;
};

type DetailPanelStateOptions = DetailPanelProps & {
  apiRef: NonNullable<DataGridProps['apiRef']>;
  initialExpandedRowIds?: Set<GridRowId>;
  getRowSpacing?: DataGridProps['getRowSpacing'];
  rowSlot?: DetailPanelContextValue['rowSlot'];
};

type ContentGetter = NonNullable<DetailPanelProps['getDetailPanelContent']>;

// Both the toggle cell and the row ask for the same content on every render. Caching per
// (content function, row object) means a panel only re-renders when either changes, and stale
// entries are garbage-collected with the rows or function that produced them.
const contentCache = new WeakMap<ContentGetter, WeakMap<GridValidRowModel, ReactNode>>();

/**
 * Owns the expanded-rows state and turns it into extra bottom spacing per row. The community
 * virtualizer already folds `getRowSpacing` into row positions, so expanded rows reserve room for
 * their panel without touching private grid APIs.
 */
const useDetailPanelState = ({
  apiRef,
  getDetailPanelContent: getContentProp,
  getDetailPanelHeight: getHeightProp,
  detailPanelExpandedRowIds,
  onDetailPanelExpandedRowIdsChange,
  initialExpandedRowIds,
  getRowSpacing: getRowSpacingProp,
  rowSlot = GridRow,
}: DetailPanelStateOptions) => {
  const [uncontrolledIds, setUncontrolledIds] = useState<Set<GridRowId>>(
    () => initialExpandedRowIds ?? new Set(),
  );
  const [measuredHeights, setMeasuredHeights] = useState<ReadonlyMap<GridRowId, number>>(
    () => new Map(),
  );
  const isControlled = detailPanelExpandedRowIds !== undefined;
  const expandedRowIds = detailPanelExpandedRowIds ?? uncontrolledIds;

  const getRowParams = useCallback(
    (id: GridRowId): GridRowParams | null => {
      const api = apiRef.current;
      const row = api?.getRow(id);
      return api && row ? { id, row, columns: api.getAllColumns() } : null;
    },
    [apiRef],
  );

  const getDetailPanelContent = useCallback(
    (id: GridRowId): ReactNode => {
      const params = getRowParams(id);
      if (!getContentProp || !params) {
        return null;
      }
      let byRow = contentCache.get(getContentProp);
      if (!byRow) {
        byRow = new WeakMap();
        contentCache.set(getContentProp, byRow);
      }
      if (!byRow.has(params.row)) {
        byRow.set(params.row, getContentProp(params));
      }
      return byRow.get(params.row);
    },
    [getContentProp, getRowParams],
  );

  const hasDetailPanel = useCallback(
    (id: GridRowId) => getDetailPanelContent(id) != null,
    [getDetailPanelContent],
  );

  const getDetailPanelHeight = useCallback(
    (id: GridRowId): number | 'auto' => {
      const params = getRowParams(id);
      return (params && getHeightProp?.(params)) ?? DEFAULT_DETAIL_PANEL_HEIGHT;
    },
    [getHeightProp, getRowParams],
  );

  const getReservedHeight = useCallback(
    (id: GridRowId) => {
      if (!expandedRowIds.has(id) || !hasDetailPanel(id)) {
        return 0;
      }
      const height = getDetailPanelHeight(id);
      return height === 'auto' ? (measuredHeights.get(id) ?? 0) : height;
    },
    [expandedRowIds, getDetailPanelHeight, hasDetailPanel, measuredHeights],
  );

  const reportDetailPanelHeight = useCallback((id: GridRowId, height: number) => {
    setMeasuredHeights((previous) => {
      if (previous.get(id) === height) {
        return previous;
      }
      const next = new Map(previous);
      next.set(id, height);
      return next;
    });
  }, []);

  const setExpandedDetailPanels = useCallback(
    (ids: Set<GridRowId>) => {
      if (!isControlled) {
        setUncontrolledIds(ids);
      }
      onDetailPanelExpandedRowIdsChange?.(ids);
    },
    [isControlled, onDetailPanelExpandedRowIdsChange],
  );

  const toggleDetailPanel = useCallback(
    (id: GridRowId) => {
      if (!hasDetailPanel(id)) {
        return;
      }
      const next = new Set(expandedRowIds);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      setExpandedDetailPanels(next);
    },
    [expandedRowIds, hasDetailPanel, setExpandedDetailPanels],
  );

  // A new function identity is what makes the grid re-hydrate row positions, so this must change
  // whenever an expanded set or a measured height changes (both are deps of getReservedHeight).
  const getRowSpacing = useCallback(
    (params: GridRowSpacingParams) => {
      const spacing = getRowSpacingProp?.(params) ?? {};
      const reserved = getReservedHeight(params.id);
      return reserved ? { ...spacing, bottom: (spacing.bottom ?? 0) + reserved } : spacing;
    },
    [getReservedHeight, getRowSpacingProp],
  );

  const value = useMemo<DetailPanelContextValue>(
    () => ({
      expandedRowIds,
      toggleDetailPanel,
      setExpandedDetailPanels,
      hasDetailPanel,
      getDetailPanelContent,
      getDetailPanelHeight,
      getReservedHeight,
      reportDetailPanelHeight,
      rowSlot,
    }),
    [
      expandedRowIds,
      toggleDetailPanel,
      setExpandedDetailPanels,
      hasDetailPanel,
      getDetailPanelContent,
      getDetailPanelHeight,
      getReservedHeight,
      reportDetailPanelHeight,
      rowSlot,
    ],
  );

  return { value, getRowSpacing };
};

export default useDetailPanelState;
