import ToolbarButton from '@components/toolbar-button';
import { ColumnsPanelTrigger, useGridRootProps } from '@mui/x-data-grid';

/** Toolbar drop-in: opens the columns panel. Hidden by `disableColumnSelector`. */
const ToolbarColumnsButton = () => {
  const { slots, localeText, disableColumnSelector } = useGridRootProps();

  if (disableColumnSelector) {
    return null;
  }

  return (
    <ColumnsPanelTrigger
      render={
        <ToolbarButton
          icon={<slots.columnSelectorIcon fontSize="small" />}
          label={localeText.toolbarColumns}
        />
      }
    />
  );
};

export default ToolbarColumnsButton;
