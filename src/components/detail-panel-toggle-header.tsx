import VisuallyHidden from '@components/visually-hidden';
import { useGridRootProps } from '@mui/x-data-grid';

/** Default `renderHeader` of the toggle column: no visible label, but named for screen readers. */
const DetailPanelToggleHeader = () => {
  const { localeText } = useGridRootProps();
  return <VisuallyHidden>{localeText.detailPanelToggle}</VisuallyHidden>;
};

export default DetailPanelToggleHeader;
