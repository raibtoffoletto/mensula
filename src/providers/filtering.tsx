import FilteringContext, { type FilteringContextValue } from '@contexts/filtering';

type FilteringProviderProps = Parent<{ value: FilteringContextValue }>;

const FilteringProvider = ({ value, children }: FilteringProviderProps) => (
  <FilteringContext.Provider value={value}>{children}</FilteringContext.Provider>
);

export default FilteringProvider;
