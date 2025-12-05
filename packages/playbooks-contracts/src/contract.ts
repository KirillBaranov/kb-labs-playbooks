import type { PluginContracts } from './types.js';
import { contractsSchemaId, contractsVersion } from './version.js';

// Level 2: Contracts типизация с as const для извлечения типов
export const pluginContractsManifest = {
  schema: contractsSchemaId,
  pluginId: '@kb-labs/playbooks',
  contractsVersion,
  artifacts: {
    // Playbook artifacts will be added in Phase 1
  },
  commands: {
    // Playbook commands will be added in Phase 1
  },
  workflows: {
    // Playbook workflows will be added in Phase 1
  },
  api: {
    rest: {
      basePath: '/v1/plugins/playbooks',
      routes: {
        // Playbook REST routes will be added in Phase 1
      }
    }
  }
} as const satisfies PluginContracts;

// Извлекаем типы для использования в других местах
export type PluginArtifactIds = keyof typeof pluginContractsManifest.artifacts;
export type PluginCommandIds = keyof typeof pluginContractsManifest.commands;
export type PluginWorkflowIds = keyof typeof pluginContractsManifest.workflows;
export type PluginRouteIds = typeof pluginContractsManifest.api extends { rest: { routes: infer R } }
  ? R extends Record<string, any>
    ? keyof R
    : never
  : never;

