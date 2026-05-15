import type { CustomPageDto } from './custom_pages.types';

export const THEME_COLORS = {
  textDark: '#292524',
  textMedium: '#57534e',
  primary: '#881337',
  bgWhite: '#ffffff',
  bgSand: '#fafaf9',
  border: '#e7e5e4',
};

export const CMS_FALLBACK_CSS = `
  .cms-html { color: ${THEME_COLORS.textMedium}; font-family: sans-serif; }
  
  .cms-html h1, .cms-html h2, .cms-html h3, .cms-html h4 {
    color: ${THEME_COLORS.primary};
    font-family: serif;
    font-weight: 700;
  }
  .cms-html h1 { font-size: 2.25rem; line-height: 2.5rem; margin: 0 0 1rem; }
  .cms-html h2 { font-size: 1.875rem; line-height: 2.25rem; margin: 2rem 0 1rem; }
  .cms-html h3 { font-size: 1.5rem; line-height: 2rem; margin: 1.5rem 0 0.75rem; }
  .cms-html h4 { font-size: 1.25rem; line-height: 1.75rem; margin: 1.5rem 0 0.5rem; }

  .cms-html p { margin: 0 0 1rem; line-height: 1.8; color: ${THEME_COLORS.textMedium}; }
  .cms-html strong { color: ${THEME_COLORS.textDark}; font-weight: 700; }
  
  .cms-html ul { margin: 1rem 0; padding-left: 1.5rem; list-style-type: disc; }
  .cms-html ol { margin: 1rem 0; padding-left: 1.5rem; list-style-type: decimal; }
  .cms-html li { margin: 0.5rem 0; color: ${THEME_COLORS.textMedium}; }

  .cms-html .container { max-width: 100%; }
  .cms-html .text-3xl { font-size: 1.875rem; }
  .cms-html .text-xl { font-size: 1.25rem; }
  .cms-html .font-semibold { font-weight: 600; }
  
  .cms-html .text-slate-900 { color: ${THEME_COLORS.textDark} !important; }
  .cms-html .text-slate-700 { color: ${THEME_COLORS.textMedium} !important; }
  
  .cms-html .bg-white { background: ${THEME_COLORS.bgWhite} !important; }
  .cms-html .bg-gray-50 { background: ${THEME_COLORS.bgSand} !important; }
  
  .cms-html .border { border: 1px solid ${THEME_COLORS.border}; }
  
  .cms-html a { color: ${THEME_COLORS.primary}; text-decoration: underline; }
  .cms-html a:hover { color: ${THEME_COLORS.textDark}; }
`;

export function pickFirstPublished(items: any): CustomPageDto | null {
  const arr: CustomPageDto[] = Array.isArray(items) ? (items as any) : [];
  const published = arr.filter((p) => !!p?.is_published);
  return published[0] ?? null;
}
