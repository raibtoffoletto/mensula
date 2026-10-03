import { Box } from '@mui/material';

/** Text announced by screen readers but not shown, e.g. the label of an icon-only column. */
const VisuallyHidden = ({ children }: Parent) => (
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
    {children}
  </Box>
);

export default VisuallyHidden;
