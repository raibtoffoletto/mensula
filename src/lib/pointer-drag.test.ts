import { DRAG_PREVIEW_CLASS } from '@lib/drag-preview';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { closestAtPoint, isMovingToward, trackPointerDrag } from './pointer-drag';

const press = (init: PointerEventInit = {}) =>
  new PointerEvent('pointerdown', { pointerId: 1, clientX: 0, clientY: 0, ...init });

const fire = (type: string, init: PointerEventInit = {}) =>
  window.dispatchEvent(new PointerEvent(type, { pointerId: 1, ...init }));

const callbacks = () => ({ onStart: vi.fn(), onMove: vi.fn(), onEnd: vi.fn() });

const isGrabbing = () =>
  [...document.head.querySelectorAll('style')].some((style) =>
    style.textContent?.includes('cursor: grabbing'),
  );

const clickReaches = () => {
  const button = document.body.appendChild(document.createElement('button'));
  const onClick = vi.fn();
  button.addEventListener('click', onClick);
  button.click();
  button.remove();
  return onClick.mock.calls.length > 0;
};

/** A scroll container 200×100 at the origin whose scroll offsets clamp at 0, like a browser's. */
const scrollBox = () => {
  const box = document.createElement('div');
  vi.spyOn(box, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 200, 100));
  for (const key of ['scrollLeft', 'scrollTop']) {
    let value = 0;
    Object.defineProperty(box, key, {
      get: () => value,
      set: (next: number) => {
        value = Math.max(0, next);
      },
    });
  }
  return box;
};

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  document.body.replaceChildren();
});

describe('trackPointerDrag', () => {
  it('stays a click below the drag threshold', () => {
    const handlers = callbacks();
    trackPointerDrag(press(), { axis: 'x', ...handlers });

    fire('pointermove', { clientX: 3 });
    fire('pointerup');

    expect(handlers.onStart).not.toHaveBeenCalled();
    expect(handlers.onEnd).not.toHaveBeenCalled();
    expect(isGrabbing()).toBe(false);
    expect(clickReaches()).toBe(true);
  });

  it('reports movement along its axis and swallows only the click after the drop', () => {
    const handlers = callbacks();
    trackPointerDrag(press(), { axis: 'x', ...handlers });

    fire('pointermove', { clientX: 10 });
    expect(handlers.onStart).toHaveBeenCalledTimes(1);
    expect(handlers.onMove).toHaveBeenLastCalledWith({ x: 10, y: 0 }, 1);
    expect(isGrabbing()).toBe(true);

    fire('pointermove', { clientX: 4 });
    expect(handlers.onMove).toHaveBeenLastCalledWith({ x: 4, y: 0 }, -1);

    // Off-axis movement is not a move.
    fire('pointermove', { clientX: 4, clientY: 30 });
    expect(handlers.onMove).toHaveBeenCalledTimes(2);

    fire('pointerup');
    expect(handlers.onEnd).toHaveBeenCalledTimes(1);
    expect(isGrabbing()).toBe(false);
    expect(clickReaches()).toBe(false);
    expect(clickReaches()).toBe(true);
  });

  it('follows the y axis', () => {
    const handlers = callbacks();
    trackPointerDrag(press(), { axis: 'y', ...handlers });

    fire('pointermove', { clientY: -8 });

    expect(handlers.onMove).toHaveBeenLastCalledWith({ x: 0, y: -8 }, -1);
  });

  it('ignores other pointers', () => {
    const handlers = callbacks();
    trackPointerDrag(press(), { axis: 'x', ...handlers });

    fire('pointermove', { pointerId: 2, clientX: 50 });
    fire('pointermove', { clientX: 50 });
    fire('pointerup', { pointerId: 2 });

    expect(handlers.onMove).toHaveBeenCalledTimes(1);
    expect(handlers.onEnd).not.toHaveBeenCalled();
  });

  it('ends on pointercancel and stops listening', () => {
    const handlers = callbacks();
    trackPointerDrag(press(), { axis: 'x', ...handlers });

    fire('pointermove', { clientX: 10 });
    fire('pointercancel');
    fire('pointermove', { clientX: 30 });

    expect(handlers.onEnd).toHaveBeenCalledTimes(1);
    expect(handlers.onMove).toHaveBeenCalledTimes(1);
  });

  it('blocks text selection only while dragging', () => {
    const select = () => !document.dispatchEvent(new Event('selectstart', { cancelable: true }));
    trackPointerDrag(press(), { axis: 'x', ...callbacks() });

    expect(select()).toBe(false);
    fire('pointermove', { clientX: 10 });
    expect(select()).toBe(true);
    fire('pointerup');
    expect(select()).toBe(false);
  });

  it('autoscrolls while the pointer is near an edge of the scroll container', () => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame'] });
    const box = scrollBox();
    const handlers = callbacks();
    trackPointerDrag(press({ clientX: 100 }), { axis: 'x', scrollContainer: box, ...handlers });

    fire('pointermove', { clientX: 190 });
    handlers.onMove.mockClear();
    vi.advanceTimersToNextFrame();
    vi.advanceTimersToNextFrame();
    expect(box.scrollLeft).toBe(20);
    expect(handlers.onMove).toHaveBeenLastCalledWith({ x: 190, y: 0 }, 1);

    fire('pointermove', { clientX: 100 });
    vi.advanceTimersToNextFrame();
    expect(box.scrollLeft).toBe(20);

    // Scrolling back stops at the start, and stops reporting moves there.
    fire('pointermove', { clientX: 10 });
    vi.advanceTimersToNextFrame();
    vi.advanceTimersToNextFrame();
    vi.advanceTimersToNextFrame();
    handlers.onMove.mockClear();
    vi.advanceTimersToNextFrame();
    expect(box.scrollLeft).toBe(0);
    expect(handlers.onMove).not.toHaveBeenCalled();

    fire('pointerup');
    fire('pointermove', { clientX: 190 });
    vi.advanceTimersToNextFrame();
    expect(box.scrollLeft).toBe(0);
  });

  it('autoscrolls vertically on the y axis', () => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame'] });
    const box = scrollBox();
    trackPointerDrag(press({ clientY: 50 }), { axis: 'y', scrollContainer: box, ...callbacks() });

    fire('pointermove', { clientY: 95 });
    vi.advanceTimersToNextFrame();

    expect(box.scrollTop).toBe(10);
    expect(box.scrollLeft).toBe(0);
  });

  it('floats a copy that is still there in onEnd and settles after it', () => {
    const source = document.body.appendChild(document.createElement('div'));
    const inEnd = vi.fn(() => document.querySelector(`.${DRAG_PREVIEW_CLASS}`));
    trackPointerDrag(press(), {
      axis: 'x',
      preview: { element: source, container: document.body },
      ...callbacks(),
      onEnd: inEnd,
    });

    fire('pointermove', { clientX: 10, clientY: 3 });
    const preview = document.querySelector<HTMLElement>(`.${DRAG_PREVIEW_CLASS}`);
    expect(preview?.style.transform).toBe('translate(10px, 3px)');

    fire('pointerup');
    expect(inEnd).toHaveReturnedWith(preview);
  });

  it('aborts without onEnd, removing the copy and the cursor', () => {
    const source = document.body.appendChild(document.createElement('div'));
    const handlers = callbacks();
    const stop = trackPointerDrag(press(), {
      axis: 'x',
      preview: { element: source, container: document.body },
      ...handlers,
    });
    fire('pointermove', { clientX: 10 });

    stop();
    fire('pointerup');

    expect(handlers.onEnd).not.toHaveBeenCalled();
    expect(document.querySelector(`.${DRAG_PREVIEW_CLASS}`)).not.toBeInTheDocument();
    expect(source.style.opacity).toBe('');
    expect(isGrabbing()).toBe(false);
  });
});

describe('isMovingToward', () => {
  it.each([
    [1, 3, 1, true],
    [1, 3, -1, false],
    [3, 1, -1, true],
    [3, 1, 1, false],
    [2, 2, 1, false],
  ] as const)('from %i to %i heading %i: %s', (from, to, direction, expected) => {
    expect(isMovingToward(from, to, direction)).toBe(expected);
  });
});

describe('closestAtPoint', () => {
  it('returns the closest match under the point that belongs to the caller', () => {
    const row = document.body.appendChild(document.createElement('div'));
    row.dataset.field = 'name';
    const label = row.appendChild(document.createElement('span'));
    document.elementFromPoint = vi.fn(() => label);

    expect(closestAtPoint({ x: 1, y: 1 }, '[data-field]', () => true)).toBe(row);
    expect(closestAtPoint({ x: 1, y: 1 }, '[data-field]', () => false)).toBeNull();
    expect(closestAtPoint({ x: 1, y: 1 }, '.missing', () => true)).toBeNull();

    // @ts-expect-error -- jsdom does not implement it; the test installed a mock.
    delete document.elementFromPoint;
  });
});
