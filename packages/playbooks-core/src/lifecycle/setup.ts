// Note: SetupBuilder will be added once @kb-labs/setup-operations is linked
// Simplified stub implementation for Phase 0

type SetupInput = {
  force?: boolean;
};

type SetupContext = {
  logger?: {
    debug: (msg: string, meta?: Record<string, unknown>) => void;
    info: (msg: string, meta?: Record<string, unknown>) => void;
    warn: (msg: string, meta?: Record<string, unknown>) => void;
    error: (msg: string, meta?: Record<string, unknown>) => void;
  };
  runtime?: {
    fs?: {
      mkdir(path: string, options?: { recursive?: boolean }): Promise<void>;
      writeFile(
        path: string,
        data: string | Buffer,
        options?: { encoding?: BufferEncoding },
      ): Promise<void>;
    };
    config?: {
      ensureSection?: (
        pointer: string,
        value: unknown,
        options?: { strategy?: 'shallow' | 'deep' | 'replace' },
      ) => Promise<void>;
    };
  };
  dryRun?: boolean;
};

const PLAYBOOKS_DIR = '.kb/playbooks';
const CONFIG_PATH = `${PLAYBOOKS_DIR}/config.json`;
const README_HINT = `${PLAYBOOKS_DIR}/README.md`;

export async function run(input: SetupInput = {}, ctx: SetupContext = {}) {
  const logger = ctx.logger;
  const fs = ctx.runtime?.fs;

  const configPayload = {
    message: 'KB Labs Playbooks - AI instruction and strategy layer',
    hint: 'This directory will contain playbook registry and cache.',
    updatedAt: new Date().toISOString(),
  };
  const serializedConfig = `${JSON.stringify(configPayload, null, 2)}\n`;

  // Simple imperative API for now
  if (fs?.mkdir && fs.writeFile) {
    const readmeContent = [
      '# KB Labs Playbooks workspace files',
      '',
      '- `config.json` — playbooks plugin configuration',
      '- Playbooks registry and cache will be stored here',
      '',
      'Re-run `kb playbooks setup --force` whenever you want to regenerate defaults.',
    ].join('\n');

    await fs.mkdir(PLAYBOOKS_DIR, { recursive: true });
    await fs.writeFile(CONFIG_PATH, serializedConfig);
    await fs.writeFile(README_HINT, `${readmeContent}\n`);
    logger?.info('Playbooks workspace files created.');
  } else {
    logger?.warn(
      'ctx.runtime.fs is unavailable. Workspace files will not be created.',
    );
  }

  await ctx.runtime?.config?.ensureSection?.('plugins.playbooks', {
    createdBy: '@kb-labs/playbooks',
    force: input.force === true,
  });

  logger?.info('Playbooks setup populated .kb/playbooks assets.', {
    dryRun: ctx.dryRun === true,
    force: input.force === true,
  });

  return {
    message: 'Playbooks setup completed. Plugin is ready for Phase 1 implementation.',
    operations: [],
    configDefaults: {
      enabled: true,
    },
    suggestions: {
      scripts: {
        'playbooks:setup': 'kb playbooks setup --force',
      },
      gitignore: ['.kb/playbooks/cache/', '.kb/playbooks/registry/'],
      notes: [
        'Playbook commands will be added in Phase 1',
        'Use --kb-only if you customise permissions to touch project files.',
      ],
    },
  };
}

export default run;
