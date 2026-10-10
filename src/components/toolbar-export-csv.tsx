import ToolbarButton from '@components/toolbar-button';
import { ExportCsv, useGridRootProps, type GridToolbarExportProps } from '@mui/x-data-grid';

export type ToolbarExportCsvProps = {
  /** Passed to the CSV export; `disableToolbarButton` hides the button. */
  options?: GridToolbarExportProps['csvOptions'];
};

/** Toolbar drop-in: downloads the grid as CSV in one click, with no export menu. */
const ToolbarExportCsv = ({ options }: ToolbarExportCsvProps) => {
  const { slots, localeText } = useGridRootProps();

  if (options?.disableToolbarButton) {
    return null;
  }

  return (
    <ExportCsv
      options={options}
      render={
        <ToolbarButton
          icon={<slots.exportIcon fontSize="small" />}
          label={localeText.toolbarExport}
        />
      }
    />
  );
};

export default ToolbarExportCsv;
