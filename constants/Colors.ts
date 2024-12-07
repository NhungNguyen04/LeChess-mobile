/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#344e41';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: '#344e41', // Custom active color
    icon: '#687076',
    tabIconDefault: '#C0C0C0', // Custom inactive color
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: '#FF5733', // Custom active color
    icon: '#9BA1A6',
    tabIconDefault: '#C0C0C0', // Custom inactive color
    tabIconSelected: tintColorDark,
  },
};
