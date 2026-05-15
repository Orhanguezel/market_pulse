import { z } from 'zod';

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Geçerli hex renk kodu gerekli (ör: #b8a98a)');

export const colorTokensSchema = z.object({
  primary: hexColor,
  primaryDark: hexColor,
  accent: hexColor,
  background: hexColor,
  surfaceBase: hexColor,
  surfaceRaised: hexColor,
  surfaceMuted: hexColor,
  textStrong: hexColor,
  textBody: hexColor,
  textMuted: hexColor,
  border: hexColor,
  borderLight: hexColor,
  navBg: hexColor,
  navFg: hexColor,
  footerBg: hexColor,
  footerFg: hexColor,
  success: hexColor,
  warning: hexColor,
  danger: hexColor,
  surfaceDarkBg: hexColor,
  surfaceDarkText: hexColor,
  surfaceDarkHeading: hexColor,
}).partial();

export const typographySchema = z.object({
  fontHeading: z.string().min(1).max(200),
  fontBody: z.string().min(1).max(200),
}).partial();

export const themeUpdateSchema = z.object({
  colors: colorTokensSchema.optional(),
  typography: typographySchema.optional(),
  radius: z.string().max(20).optional(),
  darkMode: z.enum(['light', 'dark', 'system']).optional(),
});
