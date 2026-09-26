/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#111827',
    background: '#FFFFFF',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#FEE2E2',
    textSecondary: '#64748B',
    muted: '#64748B',
    border: '#E2E8F0',
    surface: '#F8FAFC',
    header: '#FFFFFF',
    search: '#FFFFFF',
    chip: '#F1F5F9',
    card: '#FFFFFF',
    image: '#E2E8F0',
    tab: '#FFFFFF',
    tabInactive: '#64748B',
    primary: '#E10613',
  },
  dark: {
    text: '#F1F5F9',
    background: '#000000',
    backgroundElement: '#0B1428',
    backgroundSelected: '#34151B',
    textSecondary: '#B0B4BA',
    muted: '#8190A8',
    border: '#1B2940',
    surface: '#080D19',
    header: '#071025',
    search: '#020817',
    chip: '#101A30',
    card: '#080D19',
    image: '#111A2C',
    tab: '#101A30',
    tabInactive: '#9AA8BF',
    primary: '#F00012',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
