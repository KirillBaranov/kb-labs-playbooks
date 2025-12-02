import {
  getArtifactId,
  type PluginArtifactIds,
} from '@kb-labs/plugin-template-contracts';
import type { PluginContext } from '@kb-labs/plugin-manifest';
import { createGreetingUseCase } from '../../application/index.js';
import type { HelloRequest } from '../schemas/hello-schema.js';
import { HelloRequestSchema, HelloResponseSchema } from '../schemas/hello-schema.js';
import type { TypedPluginContext } from './context.js';

// Level 2+: Типизированный artifact ID через contracts
const HELLO_GREETING_ARTIFACT_ID = getArtifactId('template.hello.greeting');

/**
 * Hello REST handler with typed context
 * 
 * @example
 * // Level 3+: Типизированный handler
 * export async function handleHello(
 *   input: unknown,
 *   ctx: TypedPluginContext
 * ): Promise<HelloResponse> {
 *   // ctx.artifacts.write() принимает только валидные artifact IDs
 * }
 */
export async function handleHello(
  input: unknown,
  ctx: PluginContext | TypedPluginContext = {} as PluginContext
) {
  const parsed = HelloRequestSchema.parse((input ?? {}) as Partial<HelloRequest>);

  const greeting = createGreetingUseCase({ name: parsed.name });

  ctx.logger?.info('Hello REST endpoint executed', {
    requestId: ctx.requestId,
    target: greeting.target,
    produces: [HELLO_GREETING_ARTIFACT_ID]
  });

  const response = { message: greeting.message, target: greeting.target };
  return HelloResponseSchema.parse(response);
}


