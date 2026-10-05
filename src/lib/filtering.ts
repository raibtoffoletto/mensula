import type { GridColDef, GridFilterItem, GridFilterModel } from '@mui/x-data-grid';

let lastFilterItemId = 0;

/** Ids for the filter items TableWright creates. Once there are several, each needs one. */
export const createFilterItemId = () => {
  lastFilterItemId += 1;
  return `tablewright-filter-${lastFilterItemId}`;
};

export const hasSeveralFilterItems = (model: GridFilterModel | undefined) =>
  (model?.items.length ?? 0) > 1;

/** All the community grid accepts of a filter model: its first item. */
export const withFirstFilterItemOnly = (model: GridFilterModel | undefined) =>
  model && hasSeveralFilterItems(model) ? { ...model, items: model.items.slice(0, 1) } : model;

/** The grid's (unexported) rule for a filter item that filters something. */
export const isFilterItemComplete = (item: GridFilterItem, column: GridColDef | undefined) => {
  if (item.value !== undefined) {
    // Operators like `isAnyOf` take an array; an empty one filters nothing.
    return !(Array.isArray(item.value) && item.value.length === 0);
  }
  const operator = column?.filterOperators?.find(({ value }) => value === item.operator);
  return operator?.requiresFilterValue === false;
};
