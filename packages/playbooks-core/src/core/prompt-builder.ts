/**
 * Prompt builder - builds layered prompts from playbooks
 * @module @kb-labs/playbooks-core/prompt-builder
 */

import type { Playbook, BuiltPrompt, PromptLayer } from '../types/index.js';

/**
 * Build system directives layer
 */
function buildSystemDirectives(systemPlaybooks: Playbook[]): string {
  if (systemPlaybooks.length === 0) {
    return 'You are an AI assistant for KB Labs ecosystem.';
  }

  const sections = systemPlaybooks.map((pb) => {
    return `# ${pb.metadata.tags.join(', ')}\n\n${pb.description}\n\n${pb.strategies.map((s) => `- ${s}`).join('\n')}`;
  });

  return sections.join('\n\n---\n\n');
}

/**
 * Build policies layer
 */
function buildPolicies(playbook: Playbook): string {
  const { policies } = playbook;

  const lines: string[] = ['# Behavioral Policies', ''];

  if (!policies.allowWrite && !policies.allowDelete) {
    lines.push('⚠️ READ-ONLY MODE - No file modifications allowed');
  } else {
    if (policies.allowWrite) {
      lines.push('✅ File writing: ALLOWED');
    }
    if (policies.allowDelete) {
      lines.push('⚠️ File deletion: ALLOWED (use with caution)');
    }
  }

  if (policies.restrictedPaths.length > 0) {
    lines.push('', '🚫 Restricted paths:');
    policies.restrictedPaths.forEach((path) => lines.push(`  - ${path}`));
  }

  if (policies.forbiddenActions.length > 0) {
    lines.push('', '🚫 Forbidden actions:');
    policies.forbiddenActions.forEach((action) => lines.push(`  - ${action}`));
  }

  return lines.join('\n');
}

/**
 * Build package instructions layer
 */
function buildPackageInstructions(packagePlaybooks: Playbook[]): string {
  if (packagePlaybooks.length === 0) {
    return '';
  }

  const sections = packagePlaybooks.map((pb) => {
    return `## Package: ${pb.id}\n\n${pb.description}\n\n### Strategies:\n${pb.strategies.map((s) => `- ${s}`).join('\n')}`;
  });

  return `# Package-Specific Instructions\n\n${sections.join('\n\n')}`;
}

/**
 * Build domain strategies layer
 */
function buildDomainStrategies(domainPlaybooks: Playbook[]): string {
  if (domainPlaybooks.length === 0) {
    return '';
  }

  const sections = domainPlaybooks.map((pb) => {
    return `## Domain: ${pb.scope}\n\n${pb.description}\n\n### Strategies:\n${pb.strategies.map((s) => `- ${s}`).join('\n')}`;
  });

  return `# Domain Strategies\n\n${sections.join('\n\n')}`;
}

/**
 * Build task playbook layer
 */
function buildTaskPlaybook(playbook: Playbook): string {
  const lines: string[] = [
    `# Task: ${playbook.id}`,
    '',
    playbook.description,
    '',
    '## Strategies:',
    '',
  ];

  playbook.strategies.forEach((strategy) => {
    lines.push(`${strategy}`);
  });

  if (playbook.checks.length > 0) {
    lines.push('', '## Validation Checks:', '');
    playbook.checks.forEach((check) => {
      lines.push(`- [${check.id}] ${check.description}`);
    });
  }

  if (playbook.examples.length > 0) {
    lines.push('', '## Examples:', '');
    playbook.examples.forEach((example) => {
      lines.push(`### Task: ${example.task}`, '');
      lines.push('Expected steps:');
      example.expectedSteps.forEach((step, idx) => {
        lines.push(`${idx + 1}. ${step}`);
      });
      lines.push('');
    });
  }

  return lines.join('\n');
}

/**
 * Build context layer (from Mind RAG)
 */
function buildContextLayer(contextText?: string): string {
  if (!contextText) {
    return '';
  }

  return `# Relevant Context\n\n${contextText}`;
}

/**
 * Count approximate tokens (rough estimate: 4 chars = 1 token)
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export interface BuildPromptOptions {
  mainPlaybook: Playbook;
  systemPlaybooks?: Playbook[];
  packagePlaybooks?: Playbook[];
  domainPlaybooks?: Playbook[];
  contextText?: string;
}

/**
 * Build full layered prompt from playbooks
 */
export function buildPrompt(options: BuildPromptOptions): BuiltPrompt {
  const layers: Record<PromptLayer, string> = {
    'system-directives': buildSystemDirectives(options.systemPlaybooks || []),
    policies: buildPolicies(options.mainPlaybook),
    'package-instructions': buildPackageInstructions(options.packagePlaybooks || []),
    'domain-strategies': buildDomainStrategies(options.domainPlaybooks || []),
    'task-playbook': buildTaskPlaybook(options.mainPlaybook),
    context: buildContextLayer(options.contextText),
  };

  // Build full prompt
  const fullPrompt = Object.entries(layers)
    .filter(([_, content]) => content.length > 0)
    .map(([_, content]) => content)
    .join('\n\n---\n\n');

  return {
    layers,
    fullPrompt,
    tokenCount: estimateTokens(fullPrompt),
  };
}
