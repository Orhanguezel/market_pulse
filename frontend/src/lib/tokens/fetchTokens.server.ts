import 'server-only';

import { getServerApiBase } from '@/i18n/apiBase.server';
import { DEFAULT_TOKENS } from './defaults';
import type { DesignTokens } from './types';

function isDesignTokens(value: unknown): value is DesignTokens {
  if (!value || typeof value !== 'object') return false;
  const tokens = value as Partial<DesignTokens>;
  return Boolean(tokens.colors?.brand_primary && tokens.radius && tokens.shadows && tokens.branding);
}

function mergeTokens(value: DesignTokens): DesignTokens {
  return {
    ...DEFAULT_TOKENS,
    ...value,
    colors: { ...DEFAULT_TOKENS.colors, ...value.colors },
    typography: { ...DEFAULT_TOKENS.typography, ...value.typography },
    radius: { ...DEFAULT_TOKENS.radius, ...value.radius },
    shadows: { ...DEFAULT_TOKENS.shadows, ...value.shadows },
    branding: { ...DEFAULT_TOKENS.branding, ...value.branding },
  };
}

export async function fetchDesignTokens(): Promise<DesignTokens> {
  try {
    const API_BASE = getServerApiBase();
    if (!API_BASE) return DEFAULT_TOKENS;

    // getServerApiBase: host sonunda /api yoksa ekler — fetchSetting ile aynı kök.
    const response = await fetch(`${API_BASE}/site_settings/design_tokens`, {
      next: { revalidate: 30, tags: ['design_tokens'] },
    });

    if (!response.ok) return DEFAULT_TOKENS;

    const data = await response.json();
    const rawValue = typeof data?.value === 'string' ? JSON.parse(data.value) : data?.value;

    if (!isDesignTokens(rawValue)) return DEFAULT_TOKENS;
    return mergeTokens(rawValue);
  } catch {
    return DEFAULT_TOKENS;
  }
}

export async function fetchCustomCss(): Promise<string> {
  try {
    const API_BASE = getServerApiBase();
    if (!API_BASE) return '';

    const response = await fetch(`${API_BASE}/site_settings/custom_css`, {
      next: { revalidate: 30, tags: ['custom_css'] },
    });

    if (!response.ok) return '';

    const data = await response.json();
    return typeof data?.value === 'string' ? data.value : '';
  } catch {
    return '';
  }
}
