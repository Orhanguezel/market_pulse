export function cleanSql(input: string): string {
  return input
    // Satır başı `-- ...` yorumları; INSERT içindeki `var(--font-pj)` gibi ifadeleri silme.
    .replace(/^\s*--[^\n]*(?:\n|$)/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '');
}

export function splitStatements(sql: string): string[] {
  return sql
    .split(/;\s*(?:\r?\n|$)/g)
    .map(s => s.trim())
    .filter(Boolean)
    .map(s => s.endsWith(';') ? s : s + ';');
}

export function logStep(msg: string) {
  const ts = new Date().toISOString().replace('T', ' ').replace('Z', '');
  console.log(`[${ts}] ${msg}`);
}
