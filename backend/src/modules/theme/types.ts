export interface ColorTokens {
  // Brand
  primary: string;
  primaryDark: string;
  accent: string;

  // Surface
  background: string;
  surfaceBase: string;
  surfaceRaised: string;
  surfaceMuted: string;

  // Text
  textStrong: string;
  textBody: string;
  textMuted: string;

  // Border
  border: string;
  borderLight: string;

  // Nav / Footer
  navBg: string;
  navFg: string;
  footerBg: string;
  footerFg: string;

  // Status
  success: string;
  warning: string;
  danger: string;

  // Dark surface (for dark sections on light pages)
  surfaceDarkBg: string;
  surfaceDarkText: string;
  surfaceDarkHeading: string;
}

export interface TypographyConfig {
  fontHeading: string;
  fontBody: string;
}

export interface SectionBackground {
  key: string;
  bg: string;
  overlay?: string;
  textColor?: string;
  headingColor?: string;
}

export interface ThemeConfig {
  colors: ColorTokens;
  typography: TypographyConfig;
  radius: string;
  darkMode: 'light' | 'dark' | 'system';
  sectionBackgrounds: SectionBackground[];
}

export type ThemeUpdateInput = {
  colors?: Partial<ColorTokens>;
  typography?: Partial<TypographyConfig>;
  radius?: string;
  darkMode?: 'light' | 'dark' | 'system';
  sectionBackgrounds?: SectionBackground[];
};
