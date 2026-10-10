import ToolbarButton from '@components/toolbar-button';
import { FilterPanelTrigger, useGridRootProps } from '@mui/x-data-grid';

/** Toolbar drop-in: opens the filter panel; a dot marks active filters. Hidden by `disableColumnFilter`. */
const ToolbarFiltersButton = () => {
  const { slots, localeText, disableColumnFilter } = useGridRootProps();

  if (disableColumnFilter) {
    return null;
  }

  return (
    <FilterPanelTrigger
      render={(triggerProps, state) => (
        <ToolbarButton
          icon={
            <slots.baseBadge badgeContent={state.filterCount} color="primary" variant="dot">
              <slots.openFilterButtonIcon fontSize="small" />
            </slots.baseBadge>
          }
          label={localeText.toolbarFilters}
          {...triggerProps}
          color="inherit"
        />
      )}
    />
  );
};

export default ToolbarFiltersButton;
