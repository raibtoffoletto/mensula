import { ROW_MENU_LOCALE_TEXT, type RowMenuLocaleText } from '@lib/constants';
import { useGridRootProps } from '@mui/x-data-grid';

/** Row menu labels: the English defaults, overridden by matching keys in the grid's `localeText`. */
const useRowMenuLocaleText = (): RowMenuLocaleText => {
  const { localeText } = useGridRootProps();
  return { ...ROW_MENU_LOCALE_TEXT, ...(localeText as Partial<RowMenuLocaleText>) };
};

export default useRowMenuLocaleText;
