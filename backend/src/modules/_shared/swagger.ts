import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

type JsonSchema = Record<string, unknown>;

export const okResponseSchema = {} as JsonSchema;

export const idParamsSchema = {
  type: 'object',
  required: ['id'],
  properties: {
    id: { type: 'string', format: 'uuid' },
  },
} satisfies JsonSchema;

export const authSecurity = [{ bearerAuth: [] }] as const;

export function fromZodSchema(schema: z.ZodTypeAny, name: string): JsonSchema {
  const jsonSchema = zodToJsonSchema(schema, {
    target: 'jsonSchema7',
    $refStrategy: 'none',
    name,
  }) as JsonSchema & { definitions?: Record<string, JsonSchema> };

  return jsonSchema.definitions?.[name] ?? jsonSchema;
}
