import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

/**
 * Whether the toolbar drop-ins render compact — below the theme's `md` breakpoint: the search
 * collapses behind its trigger and the text buttons become icon buttons with tooltips.
 */
const useCompactToolbar = () => {
  // `useTheme` falls back to the default theme, so this works without a `ThemeProvider`.
  const theme = useTheme();
  return useMediaQuery(theme.breakpoints.down('md'));
};

export default useCompactToolbar;
