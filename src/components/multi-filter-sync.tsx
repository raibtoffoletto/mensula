import useFilteringContext from '@hooks/use-filtering-context';
import { createFilterItemId, isFilterItemComplete } from '@lib/filtering';
import {
  GridLogicOperator,
  gridColumnLookupSelector,
  gridFilterModelSelector,
  type GridFilterItem,
  type GridFilterModel,
} from '@mui/x-data-grid';
// Internals are quarantined to this file, `pinning-sync.tsx` and `pinned-rows.tsx` (plus `vars`
// in the columns panel). The x-data-grid peer range is pinned to the tested minor.
import {
  useGridPrivateApiContext,
  useGridRegisterPipeProcessor,
  type GridApiCommunity,
  type GridPipeProcessor,
} from '@mui/x-data-grid/internals';
import { useCallback, useLayoutEffect, useRef } from 'react';

type OverriddenMethod = 'setFilterModel' | 'getFilterState' | 'showFilterPanel';

type Override<K extends OverriddenMethod> = GridApiCommunity[K] & {
  spying: true;
  target: GridApiCommunity[K];
};

/**
 * Replaces a filter method on the private and public APIs. The grid re-registers its methods on
 * every render, but only updates the `target` of a method flagged `spying` (the hook MUI's own
 * test spies rely on), so the override stays and always wraps the grid's latest method.
 */
const overrideApiMethod = <K extends OverriddenMethod>(
  apiRef: ReturnType<typeof useGridPrivateApiContext>,
  name: K,
  implement: (original: GridApiCommunity[K]) => GridApiCommunity[K],
) => {
  const apis = [apiRef.current, apiRef.current.getPublicApi()] as unknown as Record<K, unknown>[];
  const override = Object.assign(
    (...args: Parameters<GridApiCommunity[K]>) =>
      (implement(override.target) as (...a: typeof args) => unknown)(...args),
    { spying: true as const, target: apiRef.current[name] },
  ) as Override<K>;
  apis.forEach((api) => {
    api[name] = override;
  });
  return () =>
    apis.forEach((api) => {
      api[name] = override.target;
    });
};

/**
 * Renders nothing. Mounted once inside the grid (by the top pinned-rows slot) to lift the
 * community grid's one-filter limit, as `DataGridPro` does:
 * - `setFilterModel()` — which every filter change goes through — keeps every item;
 * - `getFilterState()` runs the grid's filtering once per item and combines the results with the
 *   model's logic operator, then with the quick filter;
 * - `showFilterPanel(field)` adds a filter for the column instead of replacing the others.
 */
const MultiFilterSync = () => {
  const apiRef = useGridPrivateApiContext();
  const { disableMultipleColumnsFiltering } = useFilteringContext();
  const disabledRef = useRef(disableMultipleColumnsFiltering);

  useLayoutEffect(() => {
    disabledRef.current = disableMultipleColumnsFiltering;
  }, [disableMultipleColumnsFiltering]);

  useLayoutEffect(() => {
    // The grid's sanitizing, minus the cut to one item.
    const sanitize = (model: GridFilterModel): GridFilterModel => {
      const several = model.items.length > 1;
      if (!model.items.some((item) => item.operator == null || (several && item.id == null))) {
        return model;
      }
      const lookup = gridColumnLookupSelector(apiRef);
      return {
        ...model,
        items: model.items.map((item) => ({
          ...item,
          id: item.id ?? createFilterItemId(),
          operator: item.operator ?? lookup[item.field]?.filterOperators?.[0]?.value ?? '',
        })),
      };
    };

    // Whether the grid would build a filter from the item (it skips the ones it can't).
    const isActive = (item: GridFilterItem) => {
      const column = gridColumnLookupSelector(apiRef)[item.field];
      const operator = column?.filterOperators?.find(({ value }) => value === item.operator);
      if (!column || !operator) {
        return false;
      }
      const parse = (value: unknown) =>
        column.valueParser ? column.valueParser(value, undefined, column, apiRef) : value;
      const value = Array.isArray(item.value) ? item.value.map(parse) : parse(item.value);
      return typeof operator.getApplyFilterFn({ ...item, value }, column) === 'function';
    };

    const restoreSetFilterModel = overrideApiMethod(
      apiRef,
      'setFilterModel',
      (original) => (model, reason) => {
        if (disabledRef.current) {
          return original(model, reason);
        }
        if (gridFilterModelSelector(apiRef) === model) {
          return;
        }
        const filterModel = sanitize(model);
        apiRef.current.updateControlState('filter', (state) => ({ ...state, filterModel }), reason);
        apiRef.current.unstable_applyFilters();
      },
    );

    const restoreGetFilterState = overrideApiMethod(
      apiRef,
      'getFilterState',
      (original) => (model) => {
        if (disabledRef.current || model.items.length <= 1) {
          return original(model);
        }
        const filterModel = sanitize(model);
        const quickFiltered = original({ ...filterModel, items: [] });
        // Each lookup holds the rows its item filters out (as `false`).
        const lookups = filterModel.items
          .filter(isActive)
          .map(
            (item) =>
              original({ ...filterModel, items: [item], quickFilterValues: [] }).filteredRowsLookup,
          );
        const isFilteredOut =
          filterModel.logicOperator === GridLogicOperator.Or
            ? (id: string) => lookups.every((lookup) => lookup[id] === false)
            : (id: string) => lookups.some((lookup) => lookup[id] === false);
        const filteredRowsLookup = { ...quickFiltered.filteredRowsLookup };
        for (const id of new Set(lookups.flatMap((lookup) => Object.keys(lookup)))) {
          if (isFilteredOut(id)) {
            filteredRowsLookup[id] = false;
          }
        }
        return { ...quickFiltered, filteredRowsLookup, filterModel };
      },
    );

    const restoreShowFilterPanel = overrideApiMethod(
      apiRef,
      'showFilterPanel',
      (original) => (field, panelId, labelId) => {
        if (disabledRef.current || !field) {
          return original(field, panelId, labelId);
        }
        // Like Pro: drop the unfinished items, then add one for the column unless it has one.
        const model = gridFilterModelSelector(apiRef);
        const lookup = gridColumnLookupSelector(apiRef);
        const items = model.items.filter((item) => isFilterItemComplete(item, lookup[item.field]));
        const operator = lookup[field]?.filterOperators?.[0]?.value;
        if (operator && !items.some((item) => item.field === field)) {
          items.push({ id: createFilterItemId(), field, operator });
        }
        apiRef.current.setFilterModel({ ...model, items });
        original(undefined, panelId, labelId);
      },
    );

    return () => {
      restoreSetFilterModel();
      restoreGetFilterState();
      restoreShowFilterPanel();
    };
  }, [apiRef]);

  // `restoreState()` trims the model before this sees it; put the full one back afterwards.
  const restoreFilters = useCallback<GridPipeProcessor<'restoreState'>>(
    (params, context) => {
      const filterModel = context.stateToRestore.filter?.filterModel;
      if (disabledRef.current || !filterModel || filterModel.items.length <= 1) {
        return params;
      }
      const restore = () => apiRef.current.setFilterModel(filterModel, 'restoreState');
      return { ...params, callbacks: [...params.callbacks, restore] };
    },
    [apiRef],
  );

  useGridRegisterPipeProcessor(apiRef, 'restoreState', restoreFilters);

  return null;
};

export default MultiFilterSync;
