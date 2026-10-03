import type { ColumnOrderContextValue } from '@contexts/column-order';
import { closestAtPoint, isMovingToward, trackPointerDrag } from '@lib/pointer-drag';
import {
  gridClasses,
  gridColumnFieldsSelector,
  type DataGridProps,
  type GridColumnHeaderParams,
} from '@mui/x-data-grid';
import { useEffect, useLayoutEffect, useRef, type DragEvent } from 'react';

const HEADER_SELECTOR = `.${gridClasses.columnHeader}[data-field]`;
// Presses on these keep their own behavior (resize, menu, select all, custom header controls).
const IGNORED_SELECTOR = `.${gridClasses.columnSeparator}, button, input, select, textarea, a`;

type ColumnHeaderReorderOptions = Pick<
  ColumnOrderContextValue,
  'disableColumnReorder' | 'isColumnReorderable' | 'moveColumnSilently' | 'notifyColumnOrderChange'
>;

/**
 * Lets users drag column headers to reorder them, like `DataGridPro`: the column moves live under
 * the pointer, stays within its pinned section, and `onColumnOrderChange` fires on drop. The
 * community grid forces `disableColumnReorder`, which strips the headers' native drag handlers, so
 * this listens for pointer events on the grid root instead. Mouse and pen only: touch keeps
 * scrolling the grid.
 */
const useColumnHeaderReorder = (
  apiRef: NonNullable<DataGridProps['apiRef']>,
  options: ColumnHeaderReorderOptions,
) => {
  const { disableColumnReorder } = options;
  // The listener is bound once per grid; it reads the latest callbacks from here.
  const optionsRef = useRef(options);
  useLayoutEffect(() => {
    optionsRef.current = options;
  });

  useEffect(() => {
    const root = apiRef.current?.rootElementRef.current;
    if (!root || disableColumnReorder) {
      return undefined;
    }
    // Headers of a grid nested in a detail panel belong to that grid.
    const belongsToGrid = (element: HTMLElement) =>
      element.closest(`.${gridClasses.root}`) === root;
    let stopDrag: (() => void) | undefined;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Element;
      const header = target.closest<HTMLElement>(HEADER_SELECTOR);
      const field = header?.dataset.field;
      const api = apiRef.current;
      const colDef = field ? api?.getColumn(field) : undefined;
      if (
        event.button !== 0 ||
        event.pointerType === 'touch' ||
        !header ||
        !field ||
        !api ||
        !colDef ||
        !belongsToGrid(header) ||
        target.closest(IGNORED_SELECTOR) ||
        !optionsRef.current.isColumnReorderable(field)
      ) {
        return;
      }
      const params: GridColumnHeaderParams = { field, colDef };
      const oldIndex = gridColumnFieldsSelector(apiRef).indexOf(field);

      stopDrag?.();
      stopDrag = trackPointerDrag(event, {
        axis: 'x',
        scrollContainer: root.querySelector<HTMLElement>(`.${gridClasses.virtualScroller}`),
        preview: {
          element: header,
          container: root,
          exclude: `.${gridClasses.columnSeparator}, .${gridClasses.menuIcon}`,
        },
        // The grid's own drag events give the header its "moving" style, as in DataGridPro.
        onStart: () =>
          api.publishEvent(
            'columnHeaderDragStart',
            params,
            event as unknown as DragEvent<HTMLElement>,
          ),
        onMove: (point, direction) => {
          const over = closestAtPoint(point, HEADER_SELECTOR, belongsToGrid)?.dataset.field;
          const fields = gridColumnFieldsSelector(apiRef);
          if (
            over &&
            over !== field &&
            isMovingToward(fields.indexOf(field), fields.indexOf(over), direction)
          ) {
            optionsRef.current.moveColumnSilently(field, over);
          }
        },
        onEnd: () => {
          stopDrag = undefined;
          api.publishEvent(
            'columnHeaderDragEndNative',
            params,
            event as unknown as globalThis.DragEvent,
          );
          optionsRef.current.notifyColumnOrderChange(field, oldIndex);
        },
      });
    };

    root.addEventListener('pointerdown', onPointerDown);
    return () => {
      root.removeEventListener('pointerdown', onPointerDown);
      stopDrag?.();
    };
  }, [apiRef, disableColumnReorder]);
};

export default useColumnHeaderReorder;
