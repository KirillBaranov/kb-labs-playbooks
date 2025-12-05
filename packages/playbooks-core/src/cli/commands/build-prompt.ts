/**
 * CLI command: kb playbooks build-prompt
 * Builds full prompt with Mind RAG context
 */

import { join } from 'node:path';
import { loadAllPlaybooks } from '../../core/playbook-loader.js';
import { buildPromptForTask } from '../../core/prompt-builder-with-mind.js';

export interface BuildPromptFlags {
  cwd?: string;
  task: string;
  package?: string;
  json?: boolean;
  skipMind?: boolean; // For testing without Mind
  showLayers?: boolean; // Show individual layers
}

export interface BuildPromptResult {
  ok: boolean;
  prompt?: {
    fullPrompt: string;
    tokenCount: number;
    layers?: Record<string, string>;
  };
  error?: string;
}

/**
 * Build prompt for task
 */
export async function run(flags: BuildPromptFlags): Promise<BuildPromptResult> {
  try {
    if (!flags.task) {
      throw new Error('Provide --task to build prompt');
    }

    const cwd = flags.cwd || process.cwd();
    const playbooksDir = join(cwd, 'playbooks');

    // Load all playbooks
    const playbooks = await loadAllPlaybooks(playbooksDir);

    if (playbooks.length === 0) {
      throw new Error(`No playbooks found in ${playbooksDir}`);
    }

    // Build prompt
    const result = await buildPromptForTask(flags.task, playbooks, {
      cwd,
      packageName: flags.package,
      context: {
        packageName: flags.package || 'unknown',
      },
    });

    if (!result) {
      throw new Error(`No playbook matched task: ${flags.task}`);
    }

    if (flags.json) {
      console.log(
        JSON.stringify(
          {
            fullPrompt: result.fullPrompt,
            tokenCount: result.tokenCount,
            layers: flags.showLayers ? result.layers : undefined,
          },
          null,
          2,
        ),
      );
    } else {
      if (flags.showLayers) {
        console.log('\n📋 Prompt Layers:\n');
        Object.entries(result.layers).forEach(([layer, content]) => {
          if (content) {
            console.log(`\n=== ${layer.toUpperCase()} ===\n`);
            console.log(content);
          }
        });
        console.log('\n' + '='.repeat(60) + '\n');
      }

      console.log('\n📝 Full Prompt:\n');
      console.log(result.fullPrompt);
      console.log(`\n📊 Token count: ~${result.tokenCount}\n`);
    }

    return {
      ok: true,
      prompt: {
        fullPrompt: result.fullPrompt,
        tokenCount: result.tokenCount,
        layers: flags.showLayers ? result.layers : undefined,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${message}`);
    return { ok: false, error: message };
  }
}
