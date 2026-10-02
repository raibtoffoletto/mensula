import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-docs', '@storybook/addon-links'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  typescript: {
    reactDocgen: 'react-docgen-typescript',
  },
  // vite.config.ts is shared with the library build; drop its declaration plugin so
  // Storybook runs don't regenerate (and overwrite) dist/index.d.ts.
  viteFinal: (config) => ({
    ...config,
    plugins: config.plugins
      ?.flat()
      .filter((plugin) => !(plugin && 'name' in plugin && plugin.name === 'unplugin-dts')),
  }),
};

export default config;
