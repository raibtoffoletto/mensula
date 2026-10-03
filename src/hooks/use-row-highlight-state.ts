import type { RowHighlightApi } from '@contexts/row-highlight';
import { ROW_HIGHLIGHTED_CLASS } from '@lib/constants';
import type { DataGridProps, GridRowClassNameParams, GridRowId } from '@mui/x-data-grid';
import { useCallback, useMemo, useState } from 'react';

/** Row highlighting props. */
export type RowHighlightProps = {
  /** Controlled set of highlighted rows. */
  highlightedRowIds?: Set<GridRowId>;
  /** Fired when a row is highlighted or loses its highlight. */
  onHighlightedRowIdsChange?: (ids: Set<GridRowId>) => void;
  /**
   * Stops Shift + click on a row from toggling its highlight, giving the gesture back to the
   * grid (range selection, `onRowClick`).
   */
  disableRowHighlightOnShiftClick?: boolean;
};

type RowHighlightStateOptions = Omit<RowHighlightProps, 'disableRowHighlightOnShiftClick'> & {
  initialHighlightedRowIds?: Set<GridRowId>;
  getRowClassName?: DataGridProps['getRowClassName'];
};

/**
 * Owns the highlighted-rows set (controlled or not) and folds it into `getRowClassName`, which the
 * grid applies to every row it renders, pinned ones included.
 */
const useRowHighlightState = ({
  highlightedRowIds: highlightedRowIdsProp,
  onHighlightedRowIdsChange,
  initialHighlightedRowIds,
  getRowClassName: getRowClassNameProp,
}: RowHighlightStateOptions) => {
  const [uncontrolledIds, setUncontrolledIds] = useState<Set<GridRowId>>(
    () => initialHighlightedRowIds ?? new Set(),
  );
  const isControlled = highlightedRowIdsProp !== undefined;
  const highlightedRowIds = highlightedRowIdsProp ?? uncontrolledIds;

  const setHighlightedRowIds = useCallback(
    (ids: Set<GridRowId>) => {
      if (!isControlled) {
        setUncontrolledIds(ids);
      }
      onHighlightedRowIdsChange?.(ids);
    },
    [isControlled, onHighlightedRowIdsChange],
  );

  const isRowHighlighted = useCallback(
    (id: GridRowId) => highlightedRowIds.has(id),
    [highlightedRowIds],
  );

  const toggleRowHighlight = useCallback(
    (id: GridRowId) => {
      const next = new Set(highlightedRowIds);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      setHighlightedRowIds(next);
    },
    [highlightedRowIds, setHighlightedRowIds],
  );

  // A new function identity is what makes the grid re-render its rows with the new classes.
  const getRowClassName = useCallback(
    (params: GridRowClassNameParams) => {
      const className = getRowClassNameProp?.(params);
      if (!highlightedRowIds.has(params.id)) {
        return className ?? '';
      }
      return className ? `${className} ${ROW_HIGHLIGHTED_CLASS}` : ROW_HIGHLIGHTED_CLASS;
    },
    [getRowClassNameProp, highlightedRowIds],
  );

  const value = useMemo<RowHighlightApi>(
    () => ({ highlightedRowIds, setHighlightedRowIds, toggleRowHighlight, isRowHighlighted }),
    [highlightedRowIds, setHighlightedRowIds, toggleRowHighlight, isRowHighlighted],
  );

  return { value, getRowClassName };
};

export default useRowHighlightState;
