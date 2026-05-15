import type { FastifyInstance } from 'fastify';
import {
  createExternalDbConnection,
  deleteExternalDbConnection,
  listExternalDbConnections,
  listExternalDbTables,
  runExternalDbSelectQuery,
  testExternalDbConnection,
  updateExternalDbConnection,
} from './controller';

export async function registerExternalDbAdmin(app: FastifyInstance) {
  app.get('/external-db', listExternalDbConnections);
  app.post('/external-db', createExternalDbConnection);
  app.patch('/external-db/:id', updateExternalDbConnection);
  app.delete('/external-db/:id', deleteExternalDbConnection);
  app.post('/external-db/:id/test', testExternalDbConnection);
  app.get('/external-db/:id/tables', listExternalDbTables);
  app.post('/external-db/:id/query', runExternalDbSelectQuery);
}
