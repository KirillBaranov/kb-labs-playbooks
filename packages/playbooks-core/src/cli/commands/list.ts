/**
 * CLI command: kb playbooks list
 * Lists all available playbooks
 */

import { join } from 'node:path';
import { buildRegistry } from '../../core/playbook-loader.js';

export interface ListFlags {
  cwd?: string;
  scope?: 'system' | 'package' | 'domain' | 'task' | 'policy';
  json?: boolean;
}

export interface ListResult {
  ok: boolean;
  playbooks?: Array<{
    id: string;
    scope: string;
    priority: number;
    tags: string[];
  }>;
  error?: string;
}

/**
 * List all available playbooks
 */
export async function run(flags: ListFlags = {}): Promise<ListResult> {
  try {
    const cwd = flags.cwd || process.cwd();
    const playbooksDir = join(cwd, 'playbooks');

    // Build registry
    const registry = await buildRegistry(playbooksDir);

    // Filter by scope if specified
    let playbooks = registry.playbooks;
    if (flags.scope) {
      playbooks = playbooks.filter((p) => p.scope === flags.scope);
    }

    // Sort by priority (descending) then by id
    playbooks.sort((a, b) => {
      if (b.priority !== a.priority) {
        return b.priority - a.priority;
      }
      return a.id.localeCompare(b.id);
    });

    if (flags.json) {
      console.log(JSON.stringify({ playbooks }, null, 2));
    } else {
      console.log(`\nFound ${playbooks.length} playbook(s):\n`);

      playbooks.forEach((pb) => {
        console.log(`  ${pb.id}`);
        console.log(`    Scope: ${pb.scope} | Priority: ${pb.priority}`);
        console.log(`    Tags: ${pb.tags.join(', ')}`);
        console.log('');
      });
    }

    return { ok: true, playbooks };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${message}`);
    return { ok: false, error: message };
  }
}
