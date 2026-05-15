// src/modules/theme/index.ts
// External module surface for theme. Keep explicit; no export *.

export { registerTheme } from './router';
export { registerThemeAdmin } from './admin.routes';

export {
  adminGetTheme,
  adminUpdateTheme,
  adminResetTheme,
  publicGetTheme,
} from './admin.controller';

export {
  repoGetThemeConfig,
  repoUpsertThemeConfig,
  mergeThemeConfig,
} from './repository';

export {
  deepMergeThemeConfig,
  parseStoredThemeConfig,
} from './helpers';

export { DEFAULT_THEME } from './defaults';

export { themeUpdateSchema, colorTokensSchema, typographySchema } from './validation';

export { themeConfig, THEME_ROW_ID } from './schema';
export type { ThemeConfig } from './types';
