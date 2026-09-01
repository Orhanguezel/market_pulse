import { IBM_Plex_Mono, Plus_Jakarta_Sans, Poppins, Source_Serif_4 } from 'next/font/google';

export const fontSans = Plus_Jakarta_Sans({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-pj',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
  fallback: ['system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
});

// İşletmeniyönet pazarlama yüzeyi fontu (birebir tasarım)
export const fontPoppins = Poppins({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-poppins',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800'],
  fallback: ['system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
});

export const fontSerif = Source_Serif_4({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-source-serif',
  display: 'swap',
  weight: ['400', '600', '700'],
  style: ['normal', 'italic'],
  preload: false,
  fallback: ['Georgia', 'Times New Roman', 'serif'],
});

export const fontMono = IBM_Plex_Mono({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-ibm-mono',
  display: 'swap',
  weight: ['400', '500'],
  preload: false,
  fallback: ['ui-monospace', 'monospace'],
});

export const appFontVariableClassName =
  `${fontSans.variable} ${fontSerif.variable} ${fontMono.variable} ${fontPoppins.variable}`.trim();
