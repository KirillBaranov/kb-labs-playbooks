/**
 * Setup handler for KB Labs Playbooks plugin
 *
 * Creates workspace structure in .kb/playbooks/ and initializes config defaults.
 * Based on ai-docs-plugin setup pattern.
 */

import { defaultPlaybooks } from './default-playbooks.js';

const KB_DIR = '.kb/playbooks';
const README_PATH = `${KB_DIR}/README.md`;

/**
 * Default playbooks configuration
 */
const defaultPlaybooksConfig = {
  maxContextTokens: 3000,
  defaultPreset: 'standard',
  tokenLimits: {
    system: 500,
    domain: 1000,
    task: 1500,
    mindContext: 3000,
  },
  llm: {
    cheapModel: 'gpt-4o-mini',
    expensiveModel: 'gpt-4o',
    maxRetries: 2,
    temperature: 0.2,
  },
};

/**
 * Setup input parameters
 */
type SetupInput = {
  /** Optional custom token limits */
  maxContextTokens?: number;
  /** Optional LLM config overrides */
  llmConfig?: {
    cheapModel?: string;
    expensiveModel?: string;
  };
};

/**
 * Setup context provided by plugin runtime
 */
type SetupContext = {
  logger?: {
    debug: (msg: string, meta?: Record<string, unknown>) => void;
    info: (msg: string, meta?: Record<string, unknown>) => void;
    warn: (msg: string, meta?: Record<string, unknown>) => void;
    error: (msg: string, meta?: Record<string, unknown>) => void;
  };
  runtime?: {
    pluginRoot?: string;
    fs?: {
      mkdir(path: string, options?: { recursive?: boolean }): Promise<void>;
      writeFile(path: string, data: string, options?: { encoding?: BufferEncoding }): Promise<void>;
      readFile(path: string, options?: { encoding?: BufferEncoding }): Promise<string>;
    };
    config?: {
      ensureSection?: (pointer: string, value: unknown, options?: { strategy?: 'deep' | 'replace' }) => Promise<void>;
    };
  };
};

/**
 * README content for .kb/playbooks/
 */
const README_CONTENT = `# Playbooks

Custom playbooks for this workspace.

## Directory Structure

- \`tasks/\` - Task-specific playbooks (e.g., fix-imports, debug-plugin)
- \`domains/\` - Cross-cutting domain strategies (e.g., refactoring, testing)
- \`packages/\` - Package-specific instructions (e.g., mind-engine, workflow-runtime)
- \`policies/\` - Behavioral constraints and security policies
- \`system/\` - System-wide directives and base instructions

## Playbook Format

Each playbook is a YAML file with the following structure:

\`\`\`yaml
id: "task.example"
version: "1.0.0"
scope: "task"
priority: 3

metadata:
  author: "Your Team"
  tags: ["example", "task"]
  lastUpdated: "2025-12-03"

description: |
  Description of what this playbook does.

strategies:
  - "Step 1: Do something"
  - "Step 2: Do something else"

checks:
  - id: "validation-1"
    description: "Ensure something is valid"

policies:
  allowWrite: true
  allowDelete: false
  restrictedPaths:
    - "critical/**"
  forbiddenActions:
    - "dangerous operation"

mindIntegration:
  enabled: true
  queries:
    - "Where is similar code?"
  maxContextTokens: 2000

llmConfig:
  cheapModel: "gpt-4o-mini"
  expensiveModel: "gpt-4o"
  maxRetries: 2
  temperature: 0.2
\`\`\`

## Usage

\`\`\`bash
# List all playbooks
kb playbooks list

# Resolve playbook for a task
kb playbooks resolve --task "fix broken imports"

# Build prompt with context
kb playbooks build-prompt --task "refactor module" --package "mind-engine"
\`\`\`

## Default Playbooks

The plugin comes with built-in default playbooks that are used as fallbacks.
You can override them by creating playbooks with the same ID in this directory.

## Configuration

Playbook settings can be customized in \`.kb/kb.config.json\` under the \`playbooks\` section.
`;

/**
 * Setup handler entry point
 */
export async function run(input: SetupInput = {}, ctx: SetupContext = {}) {
  ctx.logger?.info('Starting Playbooks setup...');

  // Merge input with defaults
  const config = {
    ...defaultPlaybooksConfig,
    ...(input.maxContextTokens && { maxContextTokens: input.maxContextTokens }),
    ...(input.llmConfig && {
      llm: {
        ...defaultPlaybooksConfig.llm,
        ...input.llmConfig,
      },
    }),
  };

  // Create directory structure if runtime.fs is available
  if (ctx.runtime?.fs?.mkdir && ctx.runtime.fs.writeFile) {
    try {
      // Create main directory
      await ctx.runtime.fs.mkdir(KB_DIR, { recursive: true });
      ctx.logger?.debug('Created .kb/playbooks/ directory');

      // Create subdirectories for different playbook types
      await ctx.runtime.fs.mkdir(`${KB_DIR}/tasks`, { recursive: true });
      await ctx.runtime.fs.mkdir(`${KB_DIR}/domains`, { recursive: true });
      await ctx.runtime.fs.mkdir(`${KB_DIR}/packages`, { recursive: true });
      await ctx.runtime.fs.mkdir(`${KB_DIR}/policies`, { recursive: true });
      await ctx.runtime.fs.mkdir(`${KB_DIR}/system`, { recursive: true });
      ctx.logger?.debug('Created playbook subdirectories');

      // Write README
      await ctx.runtime.fs.writeFile(README_PATH, README_CONTENT);
      ctx.logger?.debug('Created README.md');

      // Create .gitkeep files to preserve empty directories
      await ctx.runtime.fs.writeFile(
        `${KB_DIR}/tasks/.gitkeep`,
        '# Task-specific playbooks\n'
      );
      await ctx.runtime.fs.writeFile(
        `${KB_DIR}/domains/.gitkeep`,
        '# Domain strategies\n'
      );
      await ctx.runtime.fs.writeFile(
        `${KB_DIR}/packages/.gitkeep`,
        '# Package-specific instructions\n'
      );
      await ctx.runtime.fs.writeFile(
        `${KB_DIR}/policies/.gitkeep`,
        '# Security policies and constraints\n'
      );
      await ctx.runtime.fs.writeFile(
        `${KB_DIR}/system/.gitkeep`,
        '# System-wide directives\n'
      );
      ctx.logger?.debug('Created .gitkeep files');

      // Write default playbooks from embedded templates
      // These are starter templates that users can customize
      ctx.logger?.info('Writing default playbooks from embedded templates...');

      for (const [path, content] of Object.entries(defaultPlaybooks)) {
        try {
          const dest = `${KB_DIR}/${path}`;
          await ctx.runtime.fs.writeFile(dest, content);
          ctx.logger?.info(`✓ Created default playbook: ${path}`);
        } catch (err) {
          ctx.logger?.warn(`Failed to create ${path}: ${err instanceof Error ? err.message : String(err)}`);
        }
      }

      ctx.logger?.info('Default playbooks created in .kb/playbooks/');
      ctx.logger?.info('Playbooks directory structure created successfully');
    } catch (error) {
      ctx.logger?.error('Failed to create playbooks directory structure', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  } else {
    ctx.logger?.warn('Runtime filesystem API not available, skipping directory creation');
  }

  // Return config to be written by platform
  // Platform will handle writing to .kb/kb.config.json in the 'playbooks' section
  return {
    message: 'Playbooks setup complete! Run `kb playbooks list` to see available playbooks.',
    config, // Platform will write this to .kb/kb.config.json under 'playbooks' key
    suggestions: {
      gitignore: [
        '.kb/playbooks/cache/',
        '.kb/playbooks/**/*.tmp',
      ],
      scripts: {
        'playbooks:list': 'kb playbooks list',
        'playbooks:resolve': 'kb playbooks resolve --task "your task"',
        'playbooks:build': 'kb playbooks build-prompt --task "your task"',
      },
    },
  };
}

export default run;
