import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import { env } from '@/core/env';

export const pool = mysql.createPool({
  host: env.DB.host,
  port: env.DB.port,
  user: env.DB.user,
  password: env.DB.password,
  database: env.DB.name,
  connectionLimit: 10,
  supportBigNumbers: true,
  dateStrings: true,
});

export const db = drizzle(pool);
