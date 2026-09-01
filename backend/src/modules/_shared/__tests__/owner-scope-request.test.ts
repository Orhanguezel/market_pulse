import { describe, expect, test } from 'bun:test';
import { ownerScopeForRequest } from '../tenant-scope';
import { runWithTenantAndUser, runWithTenant } from '@/core/tenant-context';

// NOT: Bu dosya @/core/tenant-context'i MOCK'LAMAZ — mock.module global ve tum pakete
// sizip diger testleri bozar. Gercek runWithTenantAndUser context'i kullanilir.

function req(config: Record<string, unknown> | undefined, url: string) {
  // url alanini bilerek dolduruyoruz: ownerScopeForRequest ONA BAKMAMALI.
  return { url, routeOptions: config ? { config } : undefined } as never;
}

describe('ownerScopeForRequest — route-config tabanli, spoof edilemez', () => {
  test('user scope → aktif kullaniciya sinirlar', () => {
    runWithTenantAndUser('tenant-a', 'user-1', () => {
      expect(ownerScopeForRequest(req({ ownerScope: 'user' }, '/api/v1/market/targets'))).toBe('user-1');
    });
  });

  test('admin scope (bayrak yok) → null (tenant-geneli)', () => {
    runWithTenantAndUser('tenant-a', 'user-1', () => {
      expect(ownerScopeForRequest(req(undefined, '/api/v1/admin/market/targets'))).toBeNull();
      expect(ownerScopeForRequest(req({ ownerScope: 'admin' }, '/api/v1/admin/market/targets'))).toBeNull();
    });
  });

  test('lead-machine leadMachineScope=user de kabul edilir', () => {
    runWithTenantAndUser('tenant-a', 'user-1', () => {
      expect(ownerScopeForRequest(req({ leadMachineScope: 'user' }, '/api/v1/lead-machine/candidates'))).toBe('user-1');
    });
  });

  // GUVENLIK NOBETCISI: eski ownerScopeForUrl `url.includes('/admin/')` bakıyordu ve
  // saldirgan `?x=/admin/` ile owner filtresini dusurup tum tenant verisini goruyordu.
  // ownerScopeForRequest URL'e BAKMADIGI icin query string enjeksiyonu ETKISIZ olmali.
  test('query-string ?x=/admin/ enjeksiyonu owner filtresini DUSUREMEZ', () => {
    runWithTenantAndUser('tenant-a', 'user-1', () => {
      const spoofed = req({ ownerScope: 'user' }, '/api/v1/market/targets/abc?x=/admin/');
      expect(ownerScopeForRequest(spoofed)).toBe('user-1'); // hâlâ owner-scoped, null DEGIL
    });
  });

  test('user scope + owner context yok → fail-closed (401 firlatir)', () => {
    // Sadece tenant var, user YOK → getRequiredUserId 401 firlatmali.
    runWithTenant('tenant-a', () => {
      expect(() => ownerScopeForRequest(req({ ownerScope: 'user' }, '/api/v1/market/targets'))).toThrow();
    });
  });
});
