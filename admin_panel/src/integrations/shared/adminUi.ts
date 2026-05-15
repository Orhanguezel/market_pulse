// =============================================================
// FILE: src/integrations/shared/adminUi.ts
// FINAL — Admin UI copy (site_settings.ui_admin) normalizer
// =============================================================

import { parseJsonObject, uiText } from '@/integrations/shared';
import type { AdminNavCopy } from '@/navigation/sidebar/sidebar-items';

export type AdminUiCommonCopy = {
  actions: {
    create: string;
    edit: string;
    delete: string;
    save: string;
    cancel: string;
    refresh: string;
    search: string;
    filter: string;
    close: string;
    back: string;
    confirm: string;
  };
  states: {
    loading: string;
    error: string;
    empty: string;
    updating: string;
    saving: string;
  };
};

export type AdminUiPageCopy = Record<string, string>;

export type AdminUiCopy = {
  app_name: string;
  app_version?: string;
  developer_branding?: {
    name: string;
    url: string;
    full_name: string;
  };
  nav: AdminNavCopy;
  common: AdminUiCommonCopy;
  pages: Record<string, AdminUiPageCopy>;
};

const emptyCommon: AdminUiCommonCopy = {
  actions: {
    create: '',
    edit: '',
    delete: '',
    save: '',
    cancel: '',
    refresh: '',
    search: '',
    filter: '',
    close: '',
    back: '',
    confirm: '',
  },
  states: {
    loading: '',
    error: '',
    empty: '',
    updating: '',
    saving: '',
  },
};

const emptyNav: AdminNavCopy = {
  labels: {
    general: '',
    system: '',
    market: '',
  },
  items: {
    dashboard: '',
    site_settings: '',
    users: '',
    user_roles: '',
    notifications: '',
    storage: '',
    db: '',
    external_db: '',
    audit: '',
    profile: '',
    market_pulse: '',
    market_targets: '',
    market_leads: '',
    market_lead_scan: '',
    market_lead_candidates: '',
    market_lead_amazon: '',
    market_lead_b2b: '',
    market_lead_fair: '',
    market_lead_icp: '',
    market_lead_outreach: '',
    market_lead_learning: '',
    market_signals: '',
    market_reports: '',
    market_test_center: '',
    market_developer_notes: '',
    market_docs: '',
  },
};

export function normalizeAdminUiCopy(raw: unknown): AdminUiCopy {
  const o = parseJsonObject(raw);
  const navRaw = parseJsonObject(o.nav);
  const labelsRaw = parseJsonObject(navRaw.labels);
  const itemsRaw = parseJsonObject(navRaw.items);

  const labels: AdminNavCopy['labels'] = {
    general: uiText(labelsRaw.general),
    system: uiText(labelsRaw.system),
    market: uiText(labelsRaw.market),
  };

  const items: AdminNavCopy['items'] = {
    dashboard: uiText(itemsRaw.dashboard),
    site_settings: uiText(itemsRaw.site_settings),
    users: uiText(itemsRaw.users),
    user_roles: uiText(itemsRaw.user_roles),
    notifications: uiText(itemsRaw.notifications),
    storage: uiText(itemsRaw.storage),
    db: uiText(itemsRaw.db),
    external_db: uiText(itemsRaw.external_db),
    audit: uiText(itemsRaw.audit),
    profile: uiText(itemsRaw.profile),
    market_pulse: uiText(itemsRaw.market_pulse),
    market_targets: uiText(itemsRaw.market_targets),
    market_leads: uiText(itemsRaw.market_leads),
    market_lead_scan: uiText(itemsRaw.market_lead_scan),
    market_lead_candidates: uiText(itemsRaw.market_lead_candidates),
    market_lead_amazon: uiText(itemsRaw.market_lead_amazon),
    market_lead_b2b: uiText(itemsRaw.market_lead_b2b),
    market_lead_fair: uiText(itemsRaw.market_lead_fair),
    market_lead_icp: uiText(itemsRaw.market_lead_icp),
    market_lead_outreach: uiText(itemsRaw.market_lead_outreach),
    market_lead_learning: uiText(itemsRaw.market_lead_learning),
    market_signals: uiText(itemsRaw.market_signals),
    market_reports: uiText(itemsRaw.market_reports),
    market_test_center: uiText(itemsRaw.market_test_center),
    market_developer_notes: uiText(itemsRaw.market_developer_notes),
    market_docs: uiText(itemsRaw.market_docs),
  };

  const commonRaw = parseJsonObject(o.common);
  const actionsRaw = parseJsonObject(commonRaw.actions);
  const statesRaw = parseJsonObject(commonRaw.states);

  const common: AdminUiCommonCopy = {
    actions: {
      create: uiText(actionsRaw.create),
      edit: uiText(actionsRaw.edit),
      delete: uiText(actionsRaw.delete),
      save: uiText(actionsRaw.save),
      cancel: uiText(actionsRaw.cancel),
      refresh: uiText(actionsRaw.refresh),
      search: uiText(actionsRaw.search),
      filter: uiText(actionsRaw.filter),
      close: uiText(actionsRaw.close),
      back: uiText(actionsRaw.back),
      confirm: uiText(actionsRaw.confirm),
    },
    states: {
      loading: uiText(statesRaw.loading),
      error: uiText(statesRaw.error),
      empty: uiText(statesRaw.empty),
      updating: uiText(statesRaw.updating),
      saving: uiText(statesRaw.saving),
    },
  };

  const pagesRaw = parseJsonObject(o.pages);
  const pages: Record<string, AdminUiPageCopy> = {};
  for (const [k, v] of Object.entries(pagesRaw)) {
    const row = parseJsonObject(v);
    const out: AdminUiPageCopy = {};
    for (const [rk, rv] of Object.entries(row)) {
      out[rk] = uiText(rv);
    }
    pages[k] = out;
  }

  const devRaw = parseJsonObject(o.developer_branding);

  return {
    app_name: uiText(o.app_name),
    app_version: uiText(o.app_version),
    developer_branding: devRaw ? {
      name: uiText(devRaw.name),
      url: uiText(devRaw.url),
      full_name: uiText(devRaw.full_name),
    } : undefined,
    nav: {
      labels: { ...emptyNav.labels, ...labels },
      items: { ...emptyNav.items, ...items },
    },
    common: {
      actions: { ...emptyCommon.actions, ...common.actions },
      states: { ...emptyCommon.states, ...common.states },
    },
    pages,
  };
}
