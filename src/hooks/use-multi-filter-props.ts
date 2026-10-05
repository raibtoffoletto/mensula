import { hasSeveralFilterItems, withFirstFilterItemOnly } from '@lib/filtering';
import type { DataGridProps, GridFilterModel } from '@mui/x-data-grid';
import { useLayoutEffect, useState } from 'react';

/** Filtering props, mirroring `DataGridPro`. */
export type FilteringProps = {
  /**
   * Keeps the community grid's limit of one filter at a time: the filter panel has no
   * "Add filter" button and only the first item of `filterModel` applies.
   */
  disableMultipleColumnsFiltering?: boolean;
};

type MultiFilterPropsOptions = Required<FilteringProps> & {
  apiRef: NonNullable<DataGridProps['apiRef']>;
  filterModel?: GridFilterModel;
  onFilterModelChange?: DataGridProps['onFilterModelChange'];
  initialFilterModel?: GridFilterModel;
};

/**
 * The filter props to hand the grid. It trims a model with several items (and logs an error)
 * when it initializes its state, before `MultiFilterSync` can step in. So, when there are
 * several, the first render passes the first item only, and the full model follows once the sync
 * is in place: a controlled one through the prop on the next render, an initial one through
 * `setFilterModel()`. `onFilterModelChange` is held back until then, so the hand-over reports
 * no change.
 */
const useMultiFilterProps = ({
  apiRef,
  filterModel,
  onFilterModelChange,
  initialFilterModel,
  disableMultipleColumnsFiltering,
}: MultiFilterPropsOptions) => {
  const [deferred, setDeferred] = useState(
    () =>
      !disableMultipleColumnsFiltering &&
      (hasSeveralFilterItems(filterModel) || hasSeveralFilterItems(initialFilterModel)),
  );

  useLayoutEffect(() => {
    if (!deferred) {
      return;
    }
    if (
      filterModel === undefined &&
      initialFilterModel &&
      hasSeveralFilterItems(initialFilterModel)
    ) {
      apiRef.current?.setFilterModel(initialFilterModel);
    }
    // One extra render, before paint, once the grid can take the full model.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDeferred(false);
  }, [apiRef, deferred, filterModel, initialFilterModel]);

  if (disableMultipleColumnsFiltering) {
    return { filterModel, onFilterModelChange, initialFilterModel };
  }
  // The grid reads `initialState` once, while the model is still deferred.
  const gridInitialFilterModel = withFirstFilterItemOnly(initialFilterModel);
  return deferred
    ? {
        filterModel: withFirstFilterItemOnly(filterModel),
        onFilterModelChange: undefined,
        initialFilterModel: gridInitialFilterModel,
      }
    : { filterModel, onFilterModelChange, initialFilterModel: gridInitialFilterModel };
};

export default useMultiFilterProps;
