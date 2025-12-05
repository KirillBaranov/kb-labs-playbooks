/**
 * Prompt builder with Mind RAG integration
 * @module @kb-labs/playbooks-core/prompt-builder-with-mind
 */

import { buildPrompt, type BuildPromptOptions } from './prompt-builder.js';
import { executeMindIntegration, type PluginRuntimeContext } from '../utils/mind-client.js';
import type { Playbook, BuiltPrompt } from '../types/index.js';

export interface BuildPromptWithMindOptions extends BuildPromptOptions {
  cwd: string;
  ctx?: PluginRuntimeContext; // Plugin runtime context for Knowledge API
  context?: Record<string, string>; // Variables for Mind query interpolation
  skipMind?: boolean; // For testing
}

/**
 * Build prompt with Mind RAG context injection
 */
export async function buildPromptWithMind(
  options: BuildPromptWithMindOptions,
): Promise<BuiltPrompt> {
  let contextText = options.contextText;

  // Execute Knowledge API integration if enabled
  if (
    !options.skipMind &&
    options.mainPlaybook.mindIntegration.enabled
  ) {
    const mindResult = await executeMindIntegration(
      options.mainPlaybook.mindIntegration,
      options.context || {},
      {
        cwd: options.cwd,
        ctx: options.ctx,
      },
    );

    if (mindResult.success) {
      contextText = mindResult.context;
    } else {
      console.warn(`Knowledge query failed: ${mindResult.error}`);
      // Continue without context
    }
  }

  // Build prompt with injected context
  return buildPrompt({
    ...options,
    contextText,
  });
}

/**
 * Build prompt for specific task with automatic playbook resolution
 */
export async function buildPromptForTask(
  task: string,
  playbooks: Playbook[],
  options: {
    cwd: string;
    ctx?: PluginRuntimeContext;
    packageName?: string;
    context?: Record<string, string>;
  },
): Promise<BuiltPrompt | null> {
  const { resolvePlaybook, getPlaybooksByScope } = await import('./playbook-resolver.js');

  // Resolve main playbook
  const resolved = resolvePlaybook(playbooks, {
    task,
    packageName: options.packageName,
  });

  if (!resolved) {
    return null;
  }

  // Get supporting playbooks by scope
  const systemPlaybooks = getPlaybooksByScope(playbooks, 'system');
  const domainPlaybooks = getPlaybooksByScope(playbooks, 'domain');
  const packagePlaybooks = options.packageName
    ? playbooks.filter((p) => p.id.includes(options.packageName!))
    : [];

  // Build prompt with Knowledge API
  return buildPromptWithMind({
    mainPlaybook: resolved.playbook,
    systemPlaybooks,
    domainPlaybooks,
    packagePlaybooks,
    cwd: options.cwd,
    ctx: options.ctx,
    context: options.context,
  });
}
