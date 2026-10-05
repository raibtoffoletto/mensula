import { createFilterItemId } from '@lib/filtering';
import { styled } from '@mui/material/styles';
import {
  GridFilterPanelBase,
  GridPanelFooter,
  gridFilterModelSelector,
  gridFilterableColumnDefinitionsSelector,
  gridFilterableColumnLookupSelector,
  useGridApiContext,
  useGridRootProps,
  useGridSelector,
  type GridControlledStateReasonLookup,
  type GridFilterItem,
  type GridFilterModel,
  type GridFilterPanelProps,
} from '@mui/x-data-grid';
import { useCallback } from 'react';

// The panel lays its content out in a row; stack the footer under the filters.
const Column = styled('div')({ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 });

/**
 * `filterPanel` slot: the stock panel plus the "Add filter" and "Remove all" footer that the
 * community grid leaves out. Takes the same `slotProps.filterPanel` as the stock panel.
 */
const FilterPanel = (props: GridFilterPanelProps) => {
  const { getColumnForNewFilter, disableAddFilterButton, disableRemoveAllButton } = props;
  const apiRef = useGridApiContext();
  const rootProps = useGridRootProps();
  const filterModel = useGridSelector(apiRef, gridFilterModelSelector);
  const filterableColumns = useGridSelector(apiRef, gridFilterableColumnDefinitionsSelector);
  const filterableLookup = useGridSelector(apiRef, gridFilterableColumnLookupSelector);

  const setFilterModel = useCallback(
    (model: GridFilterModel, reason?: GridControlledStateReasonLookup['filter']) =>
      apiRef.current.setFilterModel(model, reason),
    [apiRef],
  );
  const close = useCallback(() => apiRef.current.hideFilterPanel(), [apiRef]);

  // Same pick as the stock panel: `getColumnForNewFilter`, else the first filterable column.
  const newFilter = (currentFilters: GridFilterItem[]): GridFilterItem | null => {
    const field = getColumnForNewFilter
      ? getColumnForNewFilter({ currentFilters, columns: filterableColumns })
      : filterableColumns.find((column) => column.filterOperators?.length)?.field;
    const column = filterableColumns.find((candidate) => candidate.field === field);
    const operator = column?.filterOperators?.[0]?.value;
    return column && operator ? { id: createFilterItemId(), field: column.field, operator } : null;
  };

  const addFilter = () => {
    // With no items the panel shows a placeholder filter; keep it as the first item.
    const items =
      filterModel.items.length > 0
        ? filterModel.items
        : [newFilter([])].filter((item) => item !== null);
    const next = newFilter(items);
    if (next) {
      setFilterModel({ ...filterModel, items: [...items, next] }, 'upsertFilterItems');
    }
  };

  // Like the stock panel: filters on columns that are no longer filterable stay.
  const removeAll = () => {
    const valid = filterModel.items.filter((item) => filterableLookup[item.field]);
    const readOnly = filterModel.items.filter((item) => !filterableLookup[item.field]);
    const [only] = valid;
    if (valid.length <= 1 && only?.value === undefined) {
      if (only) {
        setFilterModel({ ...filterModel, items: readOnly }, 'deleteFilterItem');
      }
      close();
      return;
    }
    setFilterModel({ ...filterModel, items: readOnly }, 'removeAllFilterItems');
  };

  const { localeText, slots, slotProps } = rootProps;
  const { baseButton: Button, filterPanelAddIcon: AddIcon } = slots;
  const { filterPanelRemoveAllIcon: RemoveAllIcon } = slots;

  return (
    <Column>
      <GridFilterPanelBase
        {...props}
        filterModel={filterModel}
        onFilterModelChange={setFilterModel}
        onClose={close}
        disableDebounce={false}
      />
      {!(disableAddFilterButton && disableRemoveAllButton) && (
        <GridPanelFooter>
          {disableAddFilterButton ? (
            <span />
          ) : (
            <Button onClick={addFilter} startIcon={<AddIcon />} {...slotProps?.baseButton}>
              {localeText.filterPanelAddFilter}
            </Button>
          )}
          {!disableRemoveAllButton && (
            <Button onClick={removeAll} startIcon={<RemoveAllIcon />} {...slotProps?.baseButton}>
              {localeText.filterPanelRemoveAll}
            </Button>
          )}
        </GridPanelFooter>
      )}
    </Column>
  );
};

export default FilterPanel;
