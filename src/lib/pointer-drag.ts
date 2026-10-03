import { createDragPreview, forceGrabbingCursor, type DragPreviewSource } from '@lib/drag-preview';

/** Pixels the pointer must travel before a press becomes a drag (so clicks still click). */
const DRAG_THRESHOLD = 4;
/** Distance from a scroll container's edge that starts autoscrolling, and pixels per frame. */
const AUTOSCROLL_EDGE = 40;
const AUTOSCROLL_STEP = 10;

export type DragAxis = 'x' | 'y';
export type DragPoint = { x: number; y: number };
/** Sign of the latest movement along the axis (or of the autoscroll). */
export type DragDirection = -1 | 1;

export type PointerDragOptions = {
  axis: DragAxis;
  /** Scrolled along `axis` while the pointer is near its edges. */
  scrollContainer?: HTMLElement | null;
  /** Element to float a copy of under the pointer while dragging. */
  preview?: DragPreviewSource;
  onStart: () => void;
  onMove: (point: DragPoint, direction: DragDirection) => void;
  onEnd: () => void;
};

const along = (axis: DragAxis, point: DragPoint) => (axis === 'x' ? point.x : point.y);

/** Swallows the click the browser fires right after a drag's pointerup (e.g. header sorting). */
const suppressNextClick = () => {
  const block = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };
  window.addEventListener('click', block, { capture: true, once: true });
  setTimeout(() => window.removeEventListener('click', block, { capture: true }), 0);
};

const edgeDirection = (container: HTMLElement, axis: DragAxis, point: DragPoint) => {
  const rect = container.getBoundingClientRect();
  const [start, end] = axis === 'x' ? [rect.left, rect.right] : [rect.top, rect.bottom];
  const position = along(axis, point);
  if (position < start + AUTOSCROLL_EDGE) {
    return -1;
  }
  return position > end - AUTOSCROLL_EDGE ? 1 : 0;
};

/**
 * Follows a pointer from `down` until it is released. Past a small threshold it becomes a drag:
 * the cursor turns to grabbing, a copy of the preview element follows the pointer, text selection
 * is blocked, the scroll container autoscrolls near its edges, and the click that follows the
 * release is swallowed. Built on pointer events rather than native drag and drop so it
 * needs no `draggable` attribute (which the community grid forces off on headers). Returns a
 * function that aborts tracking without calling `onEnd`.
 */
export const trackPointerDrag = (down: PointerEvent, options: PointerDragOptions) => {
  const { axis, scrollContainer, preview: previewSource, onStart, onMove, onEnd } = options;
  const start: DragPoint = { x: down.clientX, y: down.clientY };
  let last = start;
  let dragging = false;
  let frame = 0;
  let preview: ReturnType<typeof createDragPreview> | undefined;
  let releaseCursor: (() => void) | undefined;

  const autoscroll = () => {
    const direction = scrollContainer ? edgeDirection(scrollContainer, axis, last) : 0;
    if (scrollContainer && direction !== 0) {
      const key = axis === 'x' ? 'scrollLeft' : 'scrollTop';
      const before = scrollContainer[key];
      scrollContainer[key] = before + direction * AUTOSCROLL_STEP;
      if (scrollContainer[key] !== before) {
        onMove(last, direction);
      }
    }
    frame = requestAnimationFrame(autoscroll);
  };

  const onPointerMove = (event: PointerEvent) => {
    if (event.pointerId !== down.pointerId) {
      return;
    }
    const point = { x: event.clientX, y: event.clientY };
    if (!dragging) {
      if (Math.hypot(point.x - start.x, point.y - start.y) < DRAG_THRESHOLD) {
        return;
      }
      dragging = true;
      document.getSelection()?.removeAllRanges();
      releaseCursor = forceGrabbingCursor();
      preview = previewSource && createDragPreview(previewSource, start);
      onStart();
      frame = requestAnimationFrame(autoscroll);
    }
    preview?.move(point);
    const delta = along(axis, point) - along(axis, last);
    last = point;
    if (delta !== 0) {
      onMove(point, delta > 0 ? 1 : -1);
    }
  };

  const onSelectStart = (event: Event) => {
    if (dragging) {
      event.preventDefault();
    }
  };

  const release = () => {
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    window.removeEventListener('pointercancel', onPointerUp);
    document.removeEventListener('selectstart', onSelectStart);
    cancelAnimationFrame(frame);
    releaseCursor?.();
  };

  const stop = () => {
    release();
    preview?.remove();
  };

  function onPointerUp(event: PointerEvent) {
    if (event.pointerId !== down.pointerId) {
      return;
    }
    release();
    if (dragging) {
      suppressNextClick();
      onEnd();
      // After `onEnd`, so the copy settles where the drop left the element.
      preview?.drop();
    }
  }

  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointercancel', onPointerUp);
  document.addEventListener('selectstart', onSelectStart);
  return stop;
};

/** Closest `selector` match under the point, if `belongsTo` accepts it (e.g. not a nested grid). */
export const closestAtPoint = (
  point: DragPoint,
  selector: string,
  belongsTo: (element: HTMLElement) => boolean,
): HTMLElement | null => {
  const element = document.elementFromPoint(point.x, point.y)?.closest<HTMLElement>(selector);
  return element && belongsTo(element) ? element : null;
};

/**
 * Whether a drag over `targetIndex` should move the dragged item there: only when the pointer
 * travels toward it. After a swap the dragged item sits under the pointer, so items of different
 * sizes cannot flip back and forth.
 */
export const isMovingToward = (fromIndex: number, targetIndex: number, direction: DragDirection) =>
  (targetIndex > fromIndex && direction > 0) || (targetIndex < fromIndex && direction < 0);
