import { vi } from 'vitest';

/**
 * Stubs `matchMedia` (absent in jsdom) as a viewport narrower than every `max-width` query, so
 * `breakpoints.down(...)` matches. Undo with `vi.unstubAllGlobals()`.
 */
const mockNarrowViewport = () =>
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query.includes('max-width'),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));

export default mockNarrowViewport;
