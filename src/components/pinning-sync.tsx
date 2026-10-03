import useColumnOrderContext from '@hooks/use-column-order-context';
import usePinningContext from '@hooks/use-pinning-context';
import {
  GRID_ROOT_GROUP_ID,
  type GridGroupNode,
  type GridPinnedColumnFields,
  type GridRowEntry,
  type GridRowId,
  type GridTreeNode,
  type GridValidRowModel,
} from '@mui/x-data-grid';
// Internals are quarantined to this file and `pinned-rows.tsx` (plus `vars` in the columns panel):
// they are the hooks DataGridPro uses for the same features. The x-data-grid peer range is pinned
// to the tested minor.
import {
  useGridPrivateApiContext,
  useGridRegisterPipeProcessor,
  type GridPipeProcessor,
} from '@mui/x-data-grid/internals';
import { useCallback, useLayoutEffect, useRef } from 'react';

/** Shape `computeRowsUpdates()` expects when `updateRows()` targets a pinned row. */
type PinnedRowsCache = {
  topIds: GridRowId[];
  bottomIds: GridRowId[];
  idLookup: Record<GridRowId, GridValidRowModel>;
};

type CachesWithPinnedRows = { pinnedRows?: PinnedRowsCache };

const toCache = ({ top, bottom }: { top: GridRowEntry[]; bottom: GridRowEntry[] }) => ({
  topIds: top.map(({ id }) => id),
  bottomIds: bottom.map(({ id }) => id),
  idLookup: Object.fromEntries([...top, ...bottom].map(({ id, model }) => [id, model])),
});

/**
 * Renders nothing. Mounted once inside the grid (by the top pinned-rows slot) to:
 * - mirror the pinned-columns model into grid state, where headers, cells, borders and scroll
 *   shadows already read it;
 * - reorder columns so pinned ones sit at the edges, which the virtualizer requires, and the rest
 *   follow the user's column order;
 * - inject pinned rows into the row tree, which sizes the sticky top/bottom containers and
 *   feeds keyboard navigation, export and `aria-rowcount`.
 */
const PinningSync = () => {
  const apiRef = useGridPrivateApiContext();
  const { pinnedColumns, pinnedRows } = usePinningContext();
  const { fieldOrder } = useColumnOrderContext();

  // Processors read the latest values through refs so they are registered exactly once.
  const pinnedColumnsRef = useRef<GridPinnedColumnFields>(pinnedColumns);
  const fieldOrderRef = useRef(fieldOrder);
  const pinnedRowsCacheRef = useRef<PinnedRowsCache>(toCache(pinnedRows));
  const injectedRowIdsRef = useRef<GridRowId[]>([]);

  const reorderColumns = useCallback<GridPipeProcessor<'hydrateColumns'>>((columnsState) => {
    const { lookup, orderedFields } = columnsState;
    const left = (pinnedColumnsRef.current.left ?? []).filter((field) => field in lookup);
    const right = (pinnedColumnsRef.current.right ?? []).filter(
      (field) => field in lookup && !left.includes(field),
    );
    // Rank by the user's order so an unpinned column returns to its place. Generated columns
    // (checkbox) are not declared and keep their leading position.
    const rank = new Map(fieldOrderRef.current.map((field, index) => [field, index]));
    const pinned = new Set([...left, ...right]);
    const center = orderedFields
      .filter((field) => !pinned.has(field))
      .sort((a, b) => (rank.get(a) ?? -1) - (rank.get(b) ?? -1));
    return { ...columnsState, orderedFields: [...left, ...center, ...right] };
  }, []);

  const injectPinnedRows = useCallback<GridPipeProcessor<'hydrateRows'>>(
    (params) => {
      const cache = pinnedRowsCacheRef.current;
      const previousIds = injectedRowIdsRef.current;
      const nextIds = [...cache.topIds, ...cache.bottomIds];
      if (previousIds.length === 0 && nextIds.length === 0) {
        return params;
      }

      const tree = { ...params.tree };
      const lookup = { ...params.dataRowIdToModelLookup };
      const root = tree[GRID_ROOT_GROUP_ID] as GridGroupNode;
      let children = [...root.children];
      let dataRowIds = [...params.dataRowIds];
      const nextIdSet = new Set(nextIds);

      // Drop last pass's pinned nodes. A row that was pinned while also in `rows` goes back to
      // the scrolling rows, at its index in `rows` (sorting, if any, reapplies on `rowsSet`).
      const { dataRowIdToModelLookup: rowsCache, rowsBeforePartialUpdates } =
        apiRef.current.caches.rows;
      let restored = false;
      for (const id of previousIds) {
        if (tree[id]?.type !== 'pinnedRow') {
          continue;
        }
        delete tree[id];
        delete lookup[id];
        const model = rowsCache[id];
        if (model && !nextIdSet.has(id)) {
          tree[id] = { type: 'leaf', id, depth: 0, parent: GRID_ROOT_GROUP_ID, groupingKey: null };
          lookup[id] = model;
          children.push(id);
          dataRowIds.push(id);
          restored = true;
        }
      }
      if (restored) {
        const index = new Map(rowsBeforePartialUpdates.map((model, position) => [model, position]));
        const byRowsOrder = (a: GridRowId, b: GridRowId) =>
          (index.get(lookup[a]!) ?? Infinity) - (index.get(lookup[b]!) ?? Infinity);
        children.sort(byRowsOrder);
        dataRowIds.sort(byRowsOrder);
      }

      for (const id of nextIds) {
        const node: GridTreeNode = {
          type: 'pinnedRow',
          id,
          depth: 0,
          parent: GRID_ROOT_GROUP_ID,
          isAutoGenerated: false,
        };
        tree[id] = node;
        lookup[id] = cache.idLookup[id]!;
      }
      children = children.filter((id) => !nextIdSet.has(id));
      dataRowIds = dataRowIds.filter((id) => !nextIdSet.has(id));
      tree[GRID_ROOT_GROUP_ID] = { ...root, children };
      injectedRowIdsRef.current = nextIds;

      const entry = (id: GridRowId) => ({ id, model: lookup[id]! });
      return {
        ...params,
        tree,
        dataRowIds,
        dataRowIdToModelLookup: lookup,
        additionalRowGroups: {
          ...params.additionalRowGroups,
          pinnedRows: { top: cache.topIds.map(entry), bottom: cache.bottomIds.map(entry) },
        },
      };
    },
    [apiRef],
  );

  useGridRegisterPipeProcessor(apiRef, 'hydrateColumns', reorderColumns);
  useGridRegisterPipeProcessor(apiRef, 'hydrateRows', injectPinnedRows);

  // Layout effects so the first paint already shows pinned columns and rows.
  useLayoutEffect(() => {
    pinnedColumnsRef.current = pinnedColumns;
    fieldOrderRef.current = fieldOrder;
    apiRef.current.setState((state) => ({ ...state, pinnedColumns }));
    apiRef.current.requestPipeProcessorsApplication('hydrateColumns');
  }, [apiRef, pinnedColumns, fieldOrder]);

  useLayoutEffect(() => {
    const cache = toCache(pinnedRows);
    pinnedRowsCacheRef.current = cache;
    (apiRef.current.caches as CachesWithPinnedRows).pinnedRows = cache;
    apiRef.current.requestPipeProcessorsApplication('hydrateRows');
  }, [apiRef, pinnedRows]);

  return null;
};

export default PinningSync;
