// src/modules/storage/router.ts
import type { FastifyInstance } from "fastify";
import { publicServe, uploadToBucket, signPut, signMultipart } from "./controller";

export async function registerStorage(app: FastifyInstance) {
  const B = "/storage";

  app.get(`${B}/:bucket/*`, publicServe);
  app.post(`${B}/:bucket/upload`, uploadToBucket);
  app.post(`${B}/uploads/sign-put`, signPut);
  app.post(`${B}/uploads/sign-multipart`, signMultipart);
}
