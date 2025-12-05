/**
 * Playbook loader - loads and parses YAML playbooks from filesystem
 * @module @kb-labs/playbooks-core/playbook-loader
 */

import { readFile, readdir } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { parse as parseYaml } from 'yaml';
import type {
  Playbook,
  PlaybookRegistry,
  PlaybookRegistryEntry,
} from '../types/index.js';

/**
 * Load a single playbook from YAML file
 */
export async function loadPlaybook(filePath: string): Promise<Playbook> {
  const content = await readFile(filePath, 'utf-8');
  const playbook = parseYaml(content) as Playbook;

  // Basic validation
  if (!playbook.id || !playbook.scope || !playbook.priority) {
    throw new Error(`Invalid playbook at ${filePath}: missing required fields`);
  }

  return playbook;
}

/**
 * Scan directory recursively for playbook YAML files
 */
async function scanPlaybooksDir(dirPath: string): Promise<string[]> {
  const files: string[] = [];

  async function scan(dir: string) {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        await scan(fullPath);
      } else if (entry.isFile() && (extname(entry.name) === '.yml' || extname(entry.name) === '.yaml')) {
        files.push(fullPath);
      }
    }
  }

  await scan(dirPath);
  return files;
}

/**
 * Build playbook registry from directory
 */
export async function buildRegistry(
  playbooksDir: string,
): Promise<PlaybookRegistry> {
  const files = await scanPlaybooksDir(playbooksDir);
  const playbooks: PlaybookRegistryEntry[] = [];

  for (const filePath of files) {
    try {
      const playbook = await loadPlaybook(filePath);

      playbooks.push({
        id: playbook.id,
        scope: playbook.scope,
        priority: playbook.priority,
        filePath,
        tags: playbook.metadata.tags,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`Failed to load playbook ${filePath}: ${message}`);
    }
  }

  return {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    playbooks,
  };
}

/**
 * Load all playbooks from directory
 */
export async function loadAllPlaybooks(
  playbooksDir: string,
): Promise<Playbook[]> {
  const files = await scanPlaybooksDir(playbooksDir);
  const playbooks: Playbook[] = [];

  for (const filePath of files) {
    try {
      const playbook = await loadPlaybook(filePath);
      playbooks.push(playbook);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`Failed to load playbook ${filePath}: ${message}`);
    }
  }

  return playbooks;
}
