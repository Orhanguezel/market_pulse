import 'fastify';
import '@fastify/jwt';
import type { JwtUser } from '@/middleware/auth';

declare module 'fastify' {
  interface FastifyRequest {
    user: JwtUser;
  }
}
