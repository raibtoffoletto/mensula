import { createContext } from 'react';

export type FilteringContextValue = {
  /** Keeps the community grid's single-filter behavior. */
  disableMultipleColumnsFiltering: boolean;
};

const FilteringContext = createContext<FilteringContextValue>({
  disableMultipleColumnsFiltering: false,
});

export default FilteringContext;
