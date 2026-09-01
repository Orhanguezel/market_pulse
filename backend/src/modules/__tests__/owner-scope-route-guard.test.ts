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

  test('lead-machine kullanici handlerlari owner filtresini gercekten uyguluyor', () => {
    // Rota bayragi dogru olsa bile HANDLER bayragi okumayi unutabilir: listAmazonJobs
    // `req` bile almiyordu → kullanici baskasinin Amazon islerini goruyor, silemiyordu
    // (DELETE owner-scope'lu → 404). Bayrak testi bunu yakalayamaz, bu test yakalar.
    const src = read('../lead-machine/controller.ts');

    // Owner'a ait tablolara dokunan her handler owner filtresini cozmeli.
    const OWNED_TABLES = /lead_search_jobs|lead_candidates|amazon_scan_jobs|amazon_products|amazon_risk_scores/;
    // Tenant geneli (kullaniciya ozel olmayan) kaynaklar:
    const TENANT_WIDE = new Set(['rejectionPatterns', 'getKeepaUsage', 'scraperCallback', 'runSavedSearchHandler']);

    const offenders: string[] = [];
    const blocks = src.split(/\nexport const /).slice(1);
    for (const block of blocks) {
      const name = block.slice(0, block.indexOf(':')).trim();
      if (!/RouteHandler/.test(block.slice(0, 200)) || TENANT_WIDE.has(name)) continue;
      const body = block.slice(0, block.indexOf('\n};'));
      const touchesOwnedData = OWNED_TABLES.test(body) || /getSearchJob|listSearchJobs|listCandidates/.test(body);
      const resolvesOwner = /ownerUserIdForRoute|ownerScopeForRequest/.test(body);
      if (touchesOwnedData && !resolvesOwner) offenders.push(name);
    }

    expect(offenders, `owner filtresi uygulamayan handler: ${offenders.join(', ')}`).toEqual([]);
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
