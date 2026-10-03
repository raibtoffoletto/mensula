import PinningSync from '@components/pinning-sync';
import { PinnedRowPosition } from '@lib/constants';
import {
  gridClasses,
  gridRenderContextColumnsSelector,
  gridRowTreeSelector,
  useGridSelector,
} from '@mui/x-data-grid';
import {
  gridPinnedRowsSelector,
  useGridPrivateApiContext,
  type GridPinnedRowsProps,
} from '@mui/x-data-grid/internals';

/**
 * `pinnedRows` slot. The community grid already renders it at the top and bottom of the scroll
 * area (sticky) but ships an empty component; this one asks the grid's virtualizer to lay the
 * pinned rows out, exactly like DataGridPro. The top instance also hosts `PinningSync`.
 */
const PinnedRows = ({ position }: GridPinnedRowsProps) => {
  const apiRef = useGridPrivateApiContext();
  const pinnedRows = useGridSelector(apiRef, gridPinnedRowsSelector);
  // Re-render when horizontal scrolling changes which columns are virtualized in.
  useGridSelector(apiRef, gridRenderContextColumnsSelector);
  const rows = pinnedRows[position] ?? [];

  /* eslint-disable react-hooks/refs -- MUI's apiRef is a stable handle meant to be read in render */
  const elements =
    rows.length > 0
      ? apiRef.current.virtualizer.api.getters.getRows(
          {
            position,
            rows,
            renderContext: {
              firstRowIndex: 0,
              lastRowIndex: rows.length,
              firstColumnIndex: 0,
              lastColumnIndex: 0,
            },
          },
          gridRowTreeSelector(apiRef),
        )
      : null;
  /* eslint-enable react-hooks/refs */

  return (
    <>
      {position === PinnedRowPosition.Top && <PinningSync />}
      {elements && (
        <div
          className={`${gridClasses.pinnedRows} ${gridClasses[`pinnedRows--${position}`]}`}
          role="presentation"
        >
          {elements}
        </div>
      )}
    </>
  );
};

export default PinnedRows;
