import type { FastifyInstance } from 'fastify';
import { registerAuth, registerUserAdmin } from '@/modules/auth';
import { registerStorage, registerStorageAdmin } from '@/modules/storage';
import { registerProfiles } from '@/modules/profiles';
import { registerSiteSettings, registerSiteSettingsAdmin } from '@/modules/siteSettings';
import { registerMenuItems, registerMenuItemsAdmin } from '@/modules/menuItems';
import { registerUserRoles } from '@/modules/userRoles';
import { registerTheme, registerThemeAdmin } from '@/modules/theme';
import { registerNotifications } from '@/modules/notifications';
import { registerAuditAdmin } from '@/modules/audit';
import { registerTenants } from '@/modules/tenants';
import { registerPlatformSettings, registerPlatformSettingsAdmin } from '@/modules/platform-settings';

export async function registerSharedPublic(api: FastifyInstance) {
  await registerAuth(api);
  await registerStorage(api);
  await registerSiteSettings(api);
  await registerMenuItems(api);
  await registerUserRoles(api);
  await registerTheme(api);
  await registerProfiles(api);
  await registerNotifications(api);
  await registerTenants(api);
  await registerPlatformSettings(api);
}

export async function registerSharedAdmin(adminApi: FastifyInstance) {
  await registerSiteSettingsAdmin(adminApi);
  await registerMenuItemsAdmin(adminApi);
  await registerUserAdmin(adminApi);
  await registerStorageAdmin(adminApi);
  await registerThemeAdmin(adminApi);
  await registerNotifications(adminApi);
  await registerAuditAdmin(adminApi);
  await registerPlatformSettingsAdmin(adminApi);
}
