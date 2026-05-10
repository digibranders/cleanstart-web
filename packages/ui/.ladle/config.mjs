/** @type {import('@ladle/react').UserConfig} */
export default {
  stories: 'src/**/*.stories.{ts,tsx}',
  defaultStory: 'primitives--dialog',
  addons: {
    a11y: { enabled: true },
    theme: {
      enabled: true,
      defaultState: 'light',
    },
  },
};
