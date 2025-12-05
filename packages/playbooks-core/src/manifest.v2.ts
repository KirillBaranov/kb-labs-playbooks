import { defineManifest } from '@kb-labs/shared-command-kit';
import { pluginContractsManifest } from '@kb-labs/playbooks-contracts';

// Level 2: Типизация через contracts для автодополнения и проверки ID
export const manifest = defineManifest({
  schema: 'kb.plugin/2',
  id: '@kb-labs/playbooks',
  version: '0.1.0',
  display: {
    name: 'Playbooks',
    description: 'AI instruction and strategy layer providing deterministic agent behaviors, cognitive strategies, and orchestrated playbooks for KB Labs ecosystem.',
    tags: ['playbooks', 'ai', 'strategy', 'instructions']
  },
  setup: {
    handler: './setup/handler#run',
    describe: 'Initialize playbooks workspace structure and config defaults.',
    permissions: {
      capabilities: ['fs:read', 'fs:write'],
      fs: {
        mode: 'readWrite',
        allow: ['.kb/playbooks/**', '.kb/kb.config.json'],
        deny: ['.kb/plugins.json', '.git/**']
      },
      net: 'none',
      env: {
        allow: []
      },
      quotas: {
        timeoutMs: 10000,
        memoryMb: 128,
        cpuMs: 5000
      }
    }
  },
  cli: {
    commands: [
      {
        id: 'list',
        group: 'playbooks',
        describe: 'List all available playbooks',
        handler: './cli/commands/list#run',
        flags: []
      },
      // Note: Setup command is auto-generated from manifest.setup
    ]
  },
  rest: {
    basePath: '/v1/plugins/playbooks',
    routes: [
      // Playbook REST routes will be added in Phase 1
    ]
  },
  studio: {
    widgets: [
      // Playbook widgets will be added in Phase 5 (optional)
    ],
    menus: [
      // Playbook menus will be added in Phase 5 (optional)
    ],
    layouts: [
      // Playbook layouts will be added in Phase 5 (optional)
    ]
  },
  capabilities: ['fs:read', 'fs:write'],
  permissions: {
    fs: {
      mode: 'readWrite',
      allow: [
        'playbooks/**',
        '.kb/playbooks/**',
        'package.json',
        '**/package.json',
      ],
      deny: ['**/*.key', '**/*.secret']
    },
    net: {
      allowHosts: [
        'api.openai.com',
        'localhost',
        '127.0.0.1',
      ],
    },
    env: {
      allow: [
        'NODE_ENV',
        'OPENAI_API_KEY',
        'KB_LABS_*',
      ]
    },
    quotas: {
      timeoutMs: 300000, // 5 minutes for complex playbook execution
      memoryMb: 2048,
      cpuMs: 180000,
    },
    capabilities: ['fs:read', 'fs:write']
  },
  artifacts: []
});

export default manifest;
