/**
 * CLI command: kb playbooks resolve
 * Resolves the best playbook for a given task
 */

import { join } from 'node:path';
import { loadAllPlaybooks } from '../../core/playbook-loader.js';
import { resolvePlaybook, type ResolveOptions } from '../../core/playbook-resolver.js';

export interface ResolveFlags extends ResolveOptions {
  cwd?: string;
  json?: boolean;
}

export interface ResolveResult {
  ok: boolean;
  resolved?: {
    id: string;
    score: number;
    reason: string;
    description: string;
  };
  error?: string;
}

/**
 * Resolve playbook for task
 */
export async function run(flags: ResolveFlags = {}): Promise<ResolveResult> {
  try {
    if (!flags.task && !flags.packageName && !flags.domain && !flags.errorPattern) {
      throw new Error(
        'Provide at least one of: --task, --package, --domain, or --error',
      );
    }

    const cwd = flags.cwd || process.cwd();
    const playbooksDir = join(cwd, 'playbooks');

    // Load all playbooks
    const playbooks = await loadAllPlaybooks(playbooksDir);

    if (playbooks.length === 0) {
      throw new Error(`No playbooks found in ${playbooksDir}`);
    }

    // Resolve
    const resolved = resolvePlaybook(playbooks, flags);

    if (!resolved) {
      if (flags.json) {
        console.log(JSON.stringify({ resolved: null }, null, 2));
      } else {
        console.log('\nNo matching playbook found.\n');
      }
      return { ok: true };
    }

    const result = {
      id: resolved.playbook.id,
      score: resolved.matchScore,
      reason: resolved.matchReason,
      description: resolved.playbook.description,
    };

    if (flags.json) {
      console.log(JSON.stringify({ resolved: result }, null, 2));
    } else {
      console.log(`\n✅ Resolved playbook:\n`);
      console.log(`  ID: ${result.id}`);
      console.log(`  Score: ${result.score}`);
      console.log(`  Reason: ${result.reason}`);
      console.log(`  Description: ${result.description}`);
      console.log('');
    }

    return { ok: true, resolved: result };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${message}`);
    return { ok: false, error: message };
  }
}
