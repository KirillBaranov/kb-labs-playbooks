/**
 * Core TypeScript types for KB Labs Playbooks
 * @module @kb-labs/playbooks/shared/types
 */

/**
 * Playbook execution scope
 */
export type PlaybookScope = 'system' | 'package' | 'domain' | 'task' | 'policy';

/**
 * Playbook priority level (1-5, higher = more specific)
 */
export type PlaybookPriority = 1 | 2 | 3 | 4 | 5;

/**
 * LLM model tier
 */
export type LLMModel = 'gpt-4o-mini' | 'gpt-4o' | 'o1-mini' | 'o1-preview';

/**
 * Playbook input parameter definition
 */
export interface PlaybookInput {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  description?: string;
  default?: unknown;
}

/**
 * Policy check definition
 */
export interface PlaybookCheck {
  id: string;
  description: string;
}

/**
 * Policy restrictions
 */
export interface PlaybookPolicy {
  allowWrite: boolean;
  allowDelete: boolean;
  restrictedPaths: string[];
  forbiddenActions: string[];
}

/**
 * Mind RAG integration config
 */
export interface MindIntegration {
  enabled: boolean;
  queries: string[];
  maxContextTokens: number;
}

/**
 * LLM execution configuration
 */
export interface LLMConfig {
  cheapModel: LLMModel;
  expensiveModel: LLMModel;
  maxRetries: number;
  temperature: number;
}

/**
 * Playbook metadata
 */
export interface PlaybookMetadata {
  author: string;
  tags: string[];
  lastUpdated: string;
}

/**
 * Example playbook execution
 */
export interface PlaybookExample {
  task: string;
  expectedSteps: string[];
}

/**
 * Full playbook definition
 */
export interface Playbook {
  id: string;
  version: string;
  scope: PlaybookScope;
  level: PlaybookScope;
  priority: PlaybookPriority;
  metadata: PlaybookMetadata;
  description: string;
  inputs: PlaybookInput[];
  strategies: string[];
  checks: PlaybookCheck[];
  policies: PlaybookPolicy;
  mindIntegration: MindIntegration;
  llmConfig: LLMConfig;
  examples: PlaybookExample[];
}

/**
 * Playbook registry entry
 */
export interface PlaybookRegistryEntry {
  id: string;
  scope: PlaybookScope;
  priority: PlaybookPriority;
  filePath: string;
  tags: string[];
}

/**
 * Full playbook registry
 */
export interface PlaybookRegistry {
  version: string;
  generatedAt: string;
  playbooks: PlaybookRegistryEntry[];
}

/**
 * Playbook resolution result
 */
export interface ResolvedPlaybook {
  playbook: Playbook;
  matchScore: number;
  matchReason: string;
}

/**
 * Prompt layer types
 */
export type PromptLayer =
  | 'system-directives'
  | 'policies'
  | 'package-instructions'
  | 'domain-strategies'
  | 'task-playbook'
  | 'context';

/**
 * Built prompt structure
 */
export interface BuiltPrompt {
  layers: Record<PromptLayer, string>;
  fullPrompt: string;
  tokenCount: number;
}

/**
 * LLM execution result
 */
export interface LLMExecutionResult {
  success: boolean;
  output: string;
  model: LLMModel;
  tokensUsed: number;
  retries: number;
  executionTimeMs: number;
}

/**
 * Policy validation result
 */
export interface PolicyValidationResult {
  valid: boolean;
  violations: string[];
}
