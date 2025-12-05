/**
 * Playbook resolver - matches playbooks to tasks
 * @module @kb-labs/playbooks-core/playbook-resolver
 */

import type { Playbook, ResolvedPlaybook } from '../types/index.js';

export interface ResolveOptions {
  task?: string;
  packageName?: string;
  domain?: string;
  errorPattern?: string;
}

/**
 * Calculate match score for a playbook based on query
 */
function calculateMatchScore(playbook: Playbook, options: ResolveOptions): number {
  let score = 0;
  const reasons: string[] = [];

  // Exact task match in description
  if (options.task) {
    const taskLower = options.task.toLowerCase();
    const descLower = playbook.description.toLowerCase();

    if (descLower.includes(taskLower)) {
      score += 10;
      reasons.push('description match');
    }

    // Tag match
    const matchingTags = playbook.metadata.tags.filter((tag) =>
      taskLower.includes(tag.toLowerCase()) || tag.toLowerCase().includes(taskLower)
    );
    score += matchingTags.length * 5;
    if (matchingTags.length > 0) {
      reasons.push(`tag match: ${matchingTags.join(', ')}`);
    }

    // Strategy match
    const matchingStrategies = playbook.strategies.filter((strategy) =>
      taskLower.includes(strategy.toLowerCase()) ||
      strategy.toLowerCase().includes(taskLower)
    );
    score += matchingStrategies.length * 3;
  }

  // Package name match
  if (options.packageName && playbook.id.includes(options.packageName)) {
    score += 15;
    reasons.push('package match');
  }

  // Domain match
  if (options.domain && playbook.scope === 'domain' && playbook.id.includes(options.domain)) {
    score += 20;
    reasons.push('domain match');
  }

  // Error pattern match
  if (options.errorPattern) {
    const errorLower = options.errorPattern.toLowerCase();
    const descLower = playbook.description.toLowerCase();

    if (descLower.includes(errorLower)) {
      score += 12;
      reasons.push('error pattern match');
    }
  }

  // Priority boost (higher priority = more specific)
  score += playbook.priority * 2;

  return score;
}

/**
 * Resolve playbook for given task/context
 */
export function resolvePlaybook(
  playbooks: Playbook[],
  options: ResolveOptions,
): ResolvedPlaybook | null {
  if (playbooks.length === 0) {
    return null;
  }

  // Calculate scores for all playbooks
  const scored = playbooks.map((playbook) => {
    const score = calculateMatchScore(playbook, options);
    return { playbook, score };
  });

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // Return best match if score > 0
  const best = scored[0];
  if (!best || best.score === 0) {
    return null;
  }

  return {
    playbook: best.playbook,
    matchScore: best.score,
    matchReason: `Score: ${best.score} (priority: ${best.playbook.priority})`,
  };
}

/**
 * Resolve multiple playbooks (for layering)
 */
export function resolvePlaybookLayers(
  playbooks: Playbook[],
  options: ResolveOptions,
): ResolvedPlaybook[] {
  // Calculate scores for all playbooks
  const scored = playbooks
    .map((playbook) => {
      const score = calculateMatchScore(playbook, options);
      return {
        playbook,
        matchScore: score,
        matchReason: `Score: ${score} (priority: ${playbook.priority})`,
      };
    })
    .filter((item) => item.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore);

  return scored;
}

/**
 * Get playbooks by scope
 */
export function getPlaybooksByScope(
  playbooks: Playbook[],
  scope: Playbook['scope'],
): Playbook[] {
  return playbooks.filter((p) => p.scope === scope);
}
