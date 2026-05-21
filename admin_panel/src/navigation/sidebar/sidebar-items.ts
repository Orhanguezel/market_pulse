// =============================================================
// FILE: src/navigation/sidebar/sidebar-items.ts
// MarketPulse admin sidebar + settings items
// - Sidebar: only market group (workflow order)
// - Settings dropdown: general + system groups
// - Developer-only items hidden unless role === developer|super_admin
// =============================================================

import {
  Activity,
  Bell,
  BookOpenText,
  Brain,
  Building2,
  CalendarDays,
  ClipboardCheck,
  Clock,
  Code2,
  Database,
  FileSearch,
  Flame,
  HardDrive,
  Mail,
  MapPin,
  Radar,
  ScanLine,
  Search,
  Settings,
  SlidersHorizontal,
  UserCheck,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { TranslateFn } from '@/i18n';

export interface NavSubItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  comingSoon?: boolean;
  newTab?: boolean;
  isNew?: boolean;
}

export interface NavMainItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  subItems?: NavSubItem[];
  comingSoon?: boolean;
  newTab?: boolean;
  isNew?: boolean;
  badgeKey?: string;
}

export interface NavGroup {
  id: number;
  label?: string;
  items: NavMainItem[];
  /** True for groups shown only in settings dropdown, not sidebar */
  settingsGroup?: boolean;
}

export type AdminNavItemKey =
  | 'dashboard'
  | 'site_settings'
  | 'users'
  | 'user_roles'
  | 'notifications'
  | 'storage'
  | 'db'
  | 'external_db'
  | 'audit'
  | 'profile'
  | 'market_pulse'
  | 'market_targets'
  | 'market_leads'
  | 'market_lead_candidates'
  | 'market_lead_scan'
  | 'market_lead_amazon'
  | 'market_lead_b2b'
  | 'market_lead_fair'
  | 'market_lead_fair_day'
  | 'market_lead_icp'
  | 'market_lead_outreach'
  | 'market_outreach_campaigns'
  | 'market_lead_learning'
  | 'market_signals'
  | 'market_reports'
  | 'market_test_center'
  | 'market_developer_notes'
  | 'market_docs';

export type AdminNavGroupKey = 'general' | 'system' | 'market';

export type AdminNavConfigItem = {
  key: AdminNavItemKey;
  url: string;
  icon?: LucideIcon;
  badgeKey?: string;
  /** Hidden unless user has developer role */
  developerOnly?: boolean;
};

export type AdminNavConfigGroup = {
  id: number;
  key: AdminNavGroupKey;
  items: AdminNavConfigItem[];
  /** True = belongs to settings dropdown, not sidebar */
  settingsGroup?: boolean;
};

export const adminNavConfig: AdminNavConfigGroup[] = [
  {
    id: 1,
    key: 'general',
    settingsGroup: true,
    items: [
      { key: 'users', url: '/admin/users', icon: Users },
      { key: 'user_roles', url: '/admin/user-roles', icon: UserCheck },
      { key: 'profile', url: '/admin/profile', icon: Clock },
    ],
  },
  {
    id: 2,
    key: 'system',
    settingsGroup: true,
    items: [
      { key: 'notifications', url: '/admin/notifications', icon: Bell, badgeKey: 'notifications_unread' },
      { key: 'site_settings', url: '/admin/site-settings', icon: Settings },
      { key: 'storage', url: '/admin/storage', icon: HardDrive, developerOnly: true },
      { key: 'db', url: '/admin/db', icon: Database, developerOnly: true },
      { key: 'external_db', url: '/admin/external-db', icon: Database, developerOnly: true },
      { key: 'audit', url: '/admin/audit', icon: FileSearch, developerOnly: true },
    ],
  },
  {
    id: 3,
    key: 'market',
    items: [
      { key: 'market_pulse',            url: '/admin/market',                             icon: Radar },
      { key: 'market_lead_icp',         url: '/admin/market/lead-machine/icp',            icon: SlidersHorizontal },
      { key: 'market_leads',            url: '/admin/market/leads',                       icon: Users },
      { key: 'market_lead_scan',        url: '/admin/market/lead-machine/scan',          icon: ScanLine },
      { key: 'market_lead_candidates',  url: '/admin/market/lead-machine/candidates',     icon: Flame, badgeKey: 'lead_candidates_pending' },
      { key: 'market_lead_amazon',      url: '/admin/market/lead-machine/amazon',         icon: Search, developerOnly: true },
      { key: 'market_lead_b2b',         url: '/admin/market/lead-machine/b2b',            icon: Building2, developerOnly: true },
      { key: 'market_lead_fair',        url: '/admin/market/lead-machine/fair',           icon: MapPin, developerOnly: true },
      { key: 'market_lead_fair_day',    url: '/admin/market/lead-machine/fair-day',       icon: CalendarDays },
      { key: 'market_lead_outreach',    url: '/admin/market/lead-machine/outreach',       icon: Mail },
      { key: 'market_outreach_campaigns', url: '/admin/market/lead-machine/outreach-campaigns', icon: Settings },
      { key: 'market_lead_learning',    url: '/admin/market/lead-machine/learning',       icon: Brain },
      { key: 'market_targets',          url: '/admin/market/targets',                     icon: Building2 },
      { key: 'market_signals',          url: '/admin/market/signals',                     icon: Activity },
      { key: 'market_reports',          url: '/admin/market/reports',                     icon: FileSearch },
      { key: 'market_test_center',      url: '/admin/market/test-center',                 icon: ClipboardCheck, developerOnly: true },
      { key: 'market_developer_notes',  url: '/admin/market/developer-notes',             icon: Code2,          developerOnly: true },
      { key: 'market_docs',             url: '/admin/market/docs',                        icon: BookOpenText,   developerOnly: true },
    ],
  },
];

export type AdminNavCopy = {
  labels: Record<AdminNavGroupKey, string>;
  items: Record<AdminNavItemKey, string>;
};

const FALLBACK_TITLES: Record<AdminNavItemKey, string> = {
  dashboard: 'Panel',
  site_settings: 'Ayarlar',
  users: 'Kullanıcılar',
  user_roles: 'Rol Yönetimi',
  notifications: 'Bildirimler',
  storage: 'Dosya Yöneticisi',
  db: 'Veritabanı',
  external_db: 'Harici Veritabanları',
  audit: 'Denetim Kayıtları',
  profile: 'Profil',
  market_pulse:            'Ana Ekran',
  market_targets:          'Hedef Firmalar',
  market_leads:            'Lead Pipeline',
  market_lead_candidates:  'Lead Adayları',
  market_lead_scan:        'Lead Tarama',
  market_lead_amazon:      'Amazon Arama',
  market_lead_b2b:         'B2B Arama',
  market_lead_fair:        'Fuar Tarama',
  market_lead_fair_day:    'Fuar Günü',
  market_lead_icp:         'ICP Profilleri',
  market_lead_outreach:    'Outreach Taslakları',
  market_outreach_campaigns: 'Outreach Kampanyaları',
  market_lead_learning:    'Öğrenme Raporu',
  market_signals:          'Sinyaller',
  market_reports:          'Raporlar',
  market_test_center:      'Test Merkezi',
  market_developer_notes:  'Yazılımcı Notları',
  market_docs:             'Dokümantasyon',
};

const FALLBACK_LABELS: Record<AdminNavGroupKey, string> = {
  general: 'Genel',
  system: 'Sistem',
  market: 'Market Pulse',
};

function buildGroupItems(
  group: AdminNavConfigGroup,
  copy: { labels: Partial<AdminNavCopy['labels']>; items: Partial<AdminNavCopy['items']> },
  t: TranslateFn | undefined,
  isDeveloper: boolean,
): NavGroup {
  const tGroup = t ? t(`admin.sidebar.groups.${group.key}` as any) : '';
  const label =
    copy.labels[group.key] ||
    (tGroup && !tGroup.includes('admin.sidebar') ? tGroup : '') ||
    FALLBACK_LABELS[group.key] ||
    '';

  return {
    id: group.id,
    label,
    settingsGroup: group.settingsGroup,
    items: group.items
      .filter((item) => isDeveloper || !item.developerOnly)
      .map((item) => {
        const tItem = t ? t(`admin.dashboard.items.${item.key}` as any) : '';
        const title =
          copy.items[item.key] ||
          (tItem && !tItem.includes('admin.dashboard') ? tItem : '') ||
          FALLBACK_TITLES[item.key] ||
          item.key;

        return {
          title,
          url: item.url,
          icon: item.icon,
          badgeKey: item.badgeKey,
        };
      }),
  };
}

/** Items rendered in the main sidebar (market workflow group only) */
export function buildAdminSidebarItems(
  copy?: Partial<AdminNavCopy> | null,
  t?: TranslateFn,
  isDeveloper = false,
): NavGroup[] {
  const c = {
    labels: (copy?.labels ?? {}) as Partial<AdminNavCopy['labels']>,
    items: (copy?.items ?? {}) as Partial<AdminNavCopy['items']>,
  };
  return adminNavConfig
    .filter((group) => !group.settingsGroup)
    .map((group) => buildGroupItems(group, c, t, isDeveloper));
}

/** Items rendered in the ⚙️ settings dropdown (general + system groups) */
export function buildAdminSettingsItems(
  copy?: Partial<AdminNavCopy> | null,
  t?: TranslateFn,
  isDeveloper = false,
): NavGroup[] {
  const c = {
    labels: (copy?.labels ?? {}) as Partial<AdminNavCopy['labels']>,
    items: (copy?.items ?? {}) as Partial<AdminNavCopy['items']>,
  };
  return adminNavConfig
    .filter((group) => group.settingsGroup)
    .map((group) => buildGroupItems(group, c, t, isDeveloper));
}
