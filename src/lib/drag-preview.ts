/** Class on the floating copy, for tests and consumer styling. */
export const DRAG_PREVIEW_CLASS = 'Mensula-dragPreview';
/** How long the copy takes to settle onto the dropped element. */
export const DROP_ANIMATION_MS = 150;
/** Opacity of the dragged element while its copy is under the pointer. */
const SOURCE_OPACITY = '0.4';

export type DragPreviewSource = {
  /** Element copied under the pointer. The copy settles onto it when the drag ends. */
  element: HTMLElement;
  /** Where the copy is mounted, so it keeps the styles its ancestors give (grid root, panel). */
  container: HTMLElement;
  /** Parts left out of the copy (controls that make no sense mid-drag). */
  exclude?: string;
};

type Point = { x: number; y: number };

const isTransparent = (color: string) =>
  !color || color === 'transparent' || /^rgba\(.*,\s*0\)$/.test(color);

// Headers and panel rows paint no background of their own; the copy needs an opaque one.
const opaqueBackground = (element: HTMLElement) => {
  for (let current: HTMLElement | null = element; current; current = current.parentElement) {
    const { backgroundColor } = getComputedStyle(current);
    if (!isTransparent(backgroundColor)) {
      return backgroundColor;
    }
  }
  return '';
};

/**
 * Mounts a non-interactive copy of `element` over it and moves it with the pointer, like the drag
 * overlay of DnD libraries. `start` is where the pointer grabbed the element.
 */
export const createDragPreview = (
  { element, container, exclude }: DragPreviewSource,
  start: Point,
) => {
  const rect = element.getBoundingClientRect();
  const clone = element.cloneNode(true) as HTMLElement;
  clone.removeAttribute('id');
  clone.querySelectorAll('[id]').forEach((node) => node.removeAttribute('id'));
  // The press ripple of the button that started the drag would be frozen in the copy.
  clone.querySelectorAll('.MuiTouchRipple-root').forEach((node) => node.replaceChildren());
  if (exclude) {
    clone.querySelectorAll(exclude).forEach((node) => node.remove());
  }
  clone.setAttribute('aria-hidden', 'true');
  clone.inert = true;
  clone.classList.add(DRAG_PREVIEW_CLASS);
  const size = (value: number) => `${value}px`;
  Object.assign(clone.style, {
    position: 'fixed',
    left: '0px',
    top: '0px',
    margin: '0',
    width: size(rect.width),
    minWidth: size(rect.width),
    maxWidth: size(rect.width),
    height: size(rect.height),
    boxSizing: 'border-box',
    color: getComputedStyle(element).color,
    background: opaqueBackground(element),
    borderRadius: '4px',
    boxShadow: '0 6px 16px rgba(0, 0, 0, 0.28)',
    opacity: '0.95',
    pointerEvents: 'none',
    zIndex: '9999',
    willChange: 'transform',
  });
  container.appendChild(clone);

  // A transformed ancestor (e.g. the panel's popper) is the containing block of `position: fixed`:
  // measure where (0, 0) landed and compensate.
  const origin = clone.getBoundingClientRect();
  clone.style.left = size(rect.left - origin.left);
  clone.style.top = size(rect.top - origin.top);

  const sourceOpacity = element.style.opacity;
  element.style.opacity = SOURCE_OPACITY;
  const translate = (x: number, y: number) => {
    clone.style.transform = `translate(${x}px, ${y}px)`;
  };
  const remove = () => {
    clone.remove();
    element.style.opacity = sourceOpacity;
  };

  return {
    move: (point: Point) => translate(point.x - start.x, point.y - start.y),
    /** Glides onto the element's current position, then removes itself. */
    drop: () => {
      if (!element.isConnected) {
        remove();
        return;
      }
      const target = element.getBoundingClientRect();
      clone.style.transition = `transform ${DROP_ANIMATION_MS}ms ease`;
      translate(target.left - rect.left, target.top - rect.top);
      setTimeout(remove, DROP_ANIMATION_MS);
    },
    remove,
  };
};

/** Shows the grabbing cursor everywhere, whatever the element under the pointer asks for. */
export const forceGrabbingCursor = () => {
  const style = document.createElement('style');
  style.textContent = '* { cursor: grabbing !important; }';
  document.head.appendChild(style);
  return () => style.remove();
};
