import { pool } from '@/db/client';

const minimumRows = Math.max(1, Number(process.env.CUSTOMS_LAKE_MIN_ROWS ?? 1));

async function main() {
  const [rows] = await pool.execute('SELECT COUNT(*) AS count FROM customs_records');
  const count = Number((rows as Array<{ count: number | string }>)[0]?.count ?? 0);
  if (count < minimumRows) {
    throw new Error(`CUSTOMS_LAKE_NOT_READY: ${count} rows (minimum ${minimumRows})`);
  }
  console.info(`[customs-lake] ready: ${count.toLocaleString('en-US')} rows`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
