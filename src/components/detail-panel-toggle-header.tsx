import { Box } from '@mui/material';
import { useGridRootProps } from '@mui/x-data-grid';

/** Default `renderHeader` of the toggle column: no visible label, but named for screen readers. */
const DetailPanelToggleHeader = () => {
  const { localeText } = useGridRootProps();
  return (
    <Box
      component="span"
      sx={{
        position: 'absolute',
        width: 1,
        height: 1,
        overflow: 'hidden',
        clip: 'rect(0 0 0 0)',
        whiteSpace: 'nowrap',
      }}
    >
      {localeText.detailPanelToggle}
    </Box>
  );
};

export default DetailPanelToggleHeader;
