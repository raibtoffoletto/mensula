import FilteringContext from '@contexts/filtering';
import { useContext } from 'react';

const useFilteringContext = () => useContext(FilteringContext);

export default useFilteringContext;
