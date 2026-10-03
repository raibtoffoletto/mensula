import VisuallyHidden from '@components/visually-hidden';
import useRowMenuLocaleText from '@hooks/use-row-menu-locale-text';

/** Default `renderHeader` of the row menu column: no visible label, but named for screen readers. */
const RowMenuHeader = () => (
  <VisuallyHidden>{useRowMenuLocaleText().rowMenuHeaderLabel}</VisuallyHidden>
);

export default RowMenuHeader;
