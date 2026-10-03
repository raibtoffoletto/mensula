import { Box, ScopedCssBaseline, ThemeProvider, Typography, createTheme } from '@mui/material';
import type { Decorator, Preview } from '@storybook/react-vite';
import type {} from '@mui/x-data-grid/themeAugmentation';
import type { ReactNode } from 'react';

const ThemeMode = {
  Light: 'light',
  Dark: 'dark',
  SideBySide: 'side-by-side',
} as const;

type ThemeMode = (typeof ThemeMode)[keyof typeof ThemeMode];
type PaletteMode = Exclude<ThemeMode, typeof ThemeMode.SideBySide>;

// Grid panels (columns, filters) are portaled to <body>, outside ScopedCssBaseline, and set a
// background but no text color — so they would inherit the browser's default black.
const createStoryTheme = (mode: PaletteMode) =>
  createTheme({
    palette: { mode },
    components: {
      MuiDataGrid: {
        styleOverrides: {
          panelContent: ({ theme }) => ({ color: theme.palette.text.primary }),
        },
      },
    },
  });

const themes = {
  [ThemeMode.Light]: createStoryTheme(ThemeMode.Light),
  [ThemeMode.Dark]: createStoryTheme(ThemeMode.Dark),
} as const satisfies Record<PaletteMode, ReturnType<typeof createTheme>>;

const renderThemed = (mode: PaletteMode, story: ReactNode, fill: boolean, caption?: string) => (
  <ThemeProvider key={mode} theme={themes[mode]}>
    <ScopedCssBaseline sx={{ flex: '1 1 480px', minWidth: 0, minHeight: fill ? '100vh' : 0, p: 2 }}>
      {caption && (
        <Typography variant="overline" component="p" color="text.secondary" gutterBottom>
          {caption}
        </Typography>
      )}
      {story}
    </ScopedCssBaseline>
  </ThemeProvider>
);

// Wraps every story in the MUI theme picked from the toolbar. "Side by side" renders the story
// once per palette so light/dark regressions can be compared at a glance.
const withMuiTheme: Decorator = (Story, context) => {
  const mode = (context.globals.theme ?? ThemeMode.Light) as ThemeMode;
  const fill = context.viewMode !== 'docs';

  if (mode === ThemeMode.SideBySide) {
    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', minHeight: fill ? '100vh' : 0 }}>
        {renderThemed(ThemeMode.Light, <Story />, false, 'Light')}
        {renderThemed(ThemeMode.Dark, <Story />, false, 'Dark')}
      </Box>
    );
  }

  return renderThemed(mode, <Story />, fill);
};

const preview: Preview = {
  decorators: [withMuiTheme],
  globalTypes: {
    theme: {
      description: 'MUI palette mode',
      toolbar: {
        title: 'Theme',
        icon: 'mirror',
        dynamicTitle: true,
        items: [
          { value: ThemeMode.Light, title: 'Light', icon: 'sun' },
          { value: ThemeMode.Dark, title: 'Dark', icon: 'moon' },
          { value: ThemeMode.SideBySide, title: 'Side by side', icon: 'sidebyside' },
        ],
      },
    },
  },
  initialGlobals: {
    theme: ThemeMode.Light,
  },
  parameters: {
    // The theme decorator supplies its own background and padding.
    layout: 'fullscreen',
    controls: {
      // Hide the "Save / Create new story" bar so tweaking controls never rewrites story files.
      disableSaveFromUI: true,
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
