import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  DRAG_PREVIEW_CLASS,
  DROP_ANIMATION_MS,
  createDragPreview,
  forceGrabbingCursor,
} from './drag-preview';

const preview = () => document.querySelector<HTMLElement>(`.${DRAG_PREVIEW_CLASS}`);

/** `<section style="background">` › `<div id="source">` with a control, an id'd child and a ripple. */
const setup = () => {
  const container = document.body.appendChild(document.createElement('section'));
  container.style.backgroundColor = 'rgb(10, 20, 30)';
  const source = container.appendChild(document.createElement('div'));
  source.id = 'source';
  source.style.color = 'rgb(200, 0, 0)';
  source.innerHTML =
    '<span id="label">Name</span><button class="menu">⋮</button>' +
    '<span class="MuiTouchRipple-root"><span class="ripple"></span></span>';
  return { container, source };
};

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  document.body.replaceChildren();
});

describe('createDragPreview', () => {
  it('mounts an inert, unlabelled copy styled like the source', () => {
    const { container, source } = setup();
    createDragPreview({ element: source, container, exclude: '.menu' }, { x: 0, y: 0 });

    const copy = preview()!;
    expect(copy.parentElement).toBe(container);
    expect(copy).toHaveAttribute('aria-hidden', 'true');
    expect(copy.inert).toBe(true);
    expect(copy).not.toHaveAttribute('id');
    expect(copy.querySelector('[id]')).toBeNull();
    expect(copy).toHaveTextContent('Name');
    expect(copy.querySelector('.menu')).toBeNull();
    expect(copy.querySelector('.ripple')).toBeNull();
    expect(copy.style.pointerEvents).toBe('none');
    expect(copy.style.color).toBe('rgb(200, 0, 0)');
    // The source paints no background: the copy takes the nearest opaque one.
    expect(copy.style.background).toContain('rgb(10, 20, 30)');
    expect(source.style.opacity).toBe('0.4');
  });

  it('leaves the background unset when no ancestor paints one', () => {
    const source = document.body.appendChild(document.createElement('div'));
    createDragPreview({ element: source, container: document.body }, { x: 0, y: 0 });

    expect(preview()!.style.background).toBe('');
  });

  it('places the copy over the source, compensating a transformed containing block', () => {
    const { container, source } = setup();
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: HTMLElement,
    ) {
      // The copy, placed at (0, 0), lands at (10, 5): an ancestor is translated by that much.
      return this === source ? new DOMRect(50, 30, 100, 20) : new DOMRect(10, 5, 100, 20);
    });

    createDragPreview({ element: source, container }, { x: 60, y: 35 });

    expect(preview()!.style.left).toBe('40px');
    expect(preview()!.style.top).toBe('25px');
    expect(preview()!.style.width).toBe('100px');
    expect(preview()!.style.height).toBe('20px');
  });

  it('follows the pointer from where it grabbed the source', () => {
    const { container, source } = setup();
    const drag = createDragPreview({ element: source, container }, { x: 60, y: 35 });

    drag.move({ x: 90, y: 30 });

    expect(preview()!.style.transform).toBe('translate(30px, -5px)');
  });

  it('settles onto the source position on drop, then cleans up', () => {
    vi.useFakeTimers();
    const { container, source } = setup();
    const rect = vi.spyOn(source, 'getBoundingClientRect');
    rect.mockReturnValue(new DOMRect(50, 30, 100, 20));
    const drag = createDragPreview({ element: source, container }, { x: 0, y: 0 });

    // The source moved 120px right while dragging.
    rect.mockReturnValue(new DOMRect(170, 30, 100, 20));
    drag.drop();

    expect(preview()!.style.transform).toBe('translate(120px, 0px)');
    expect(preview()!.style.transition).toContain(`${DROP_ANIMATION_MS}ms`);
    vi.advanceTimersByTime(DROP_ANIMATION_MS);
    expect(preview()).toBeNull();
    expect(source.style.opacity).toBe('');
  });

  it('drops at once when the source left the DOM (e.g. virtualized away)', () => {
    const { container, source } = setup();
    const drag = createDragPreview({ element: source, container }, { x: 0, y: 0 });

    source.remove();
    drag.drop();

    expect(preview()).toBeNull();
  });

  it('restores the source opacity it found', () => {
    const { container, source } = setup();
    source.style.opacity = '0.8';
    createDragPreview({ element: source, container }, { x: 0, y: 0 }).remove();

    expect(source.style.opacity).toBe('0.8');
  });
});

describe('forceGrabbingCursor', () => {
  it('adds a global grabbing cursor until released', () => {
    const release = forceGrabbingCursor();
    const style = document.head.lastElementChild;
    expect(style?.textContent).toBe('* { cursor: grabbing !important; }');

    release();
    expect(style).not.toBeInTheDocument();
  });
});
