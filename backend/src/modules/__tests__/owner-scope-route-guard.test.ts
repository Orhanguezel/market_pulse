import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'bun:test';

// GUVENLIK NOBETCISI (statik kaynak analizi — mock yok, sizinti yok):
// Owner-scope, route KAYDINDAKI config bayragindan cozulur (ownerScopeForRequest).
// Bir user router'i bu bayragi guard'ina koymayi unutursa owner filtresi SESSIZCE duser
// (kullanicilar arasi sizinti). Bu test, kullaniciya donuk router'larin guard'inin
// ilgili bayragi tasidigini kaynak seviyesinde dogrular.

function read(rel: string): string {
  return readFileSync(new URL(rel, import.meta.url), 'utf8');
}

describe('owner-scope route guard flags (static)', () => {
  test('market user router guard carries ownerScope: user', () => {
    const src = read('../market/router.ts');
    const fn = src.slice(src.indexOf('registerMarketUser'));
    const guardLine = fn.split('\n').find((l) => l.includes('const guard'));
    expect(guardLine).toBeDefined();
    expect(guardLine).toContain("ownerScope: 'user'");
  });

  test('crm tenant router guard carries ownerScope: user', () => {
    const src = read('../crm/tenant.router.ts');
    const fn = src.slice(src.indexOf('registerCrmTenant'));
    const guardLine = fn.split('\n').find((l) => l.includes('const guard'));
    expect(guardLine).toBeDefined();
    expect(guardLine).toContain("ownerScope: 'user'");
  });

  test('lead-machine user + outreach routers carry leadMachineScope: user', () => {
    const src = read('../lead-machine/router.ts');
    for (const marker of ['registerLeadMachineUser', 'registerOutreachUser']) {
      const fn = src.slice(src.indexOf(marker));
      const guardLine = fn.split('\n').find((l) => l.includes('const guard'));
      expect(guardLine, `${marker} guard`).toBeDefined();
      expect(guardLine, `${marker} guard`).toContain("leadMachineScope: 'user'");
    }
  });

  test('decision-maker public router guard carries leadMachineScope: user', () => {
    const src = read('../lead-machine/decision-maker/router.ts');
    const fn = src.slice(src.indexOf('registerDecisionMakerPublic'));
    const guardLine = fn.split('\n').find((l) => l.includes('const guard'));
    expect(guardLine).toBeDefined();
    expect(guardLine).toContain("leadMachineScope: 'user'");
  });

  test('owner resolvers never inspect req.url (query-string spoof engeli)', () => {
    // ownerScopeForRequest req.url'e bakmamali; controller'lar da url tabanli owner
    // cozumune donmemeli. Eski `req.url.includes('/admin/')` deseni owner kararinda YASAK.
    const files = [
      '../market/controller.ts',
      '../crm/controller.ts',
      '../lead-machine/campaign/campaign.controller.ts',
    ];
    for (const f of files) {
      const src = read(f);
      expect(src.includes("url.includes('/admin/')"), `${f} url-based owner`).toBe(false);
    }
  });
});
