/**
 * Knowledge API client for context injection
 * Uses Knowledge API (universal RAG abstraction) with CLI fallback
 * @module @kb-labs/playbooks-core/mind-client
 */

import { spawn } from 'node:child_process';
import type { MindIntegration } from '../types/index.js';

/**
 * Plugin runtime context interface (minimal, for Knowledge API)
 */
export interface PluginRuntimeContext {
  knowledge?: {
    query(query: KnowledgeQuery): Promise<KnowledgeResult>;
    index?(scopeId: string, options?: { force?: boolean }): Promise<void>;
  };
}

/**
 * Knowledge API query interface
 */
export interface KnowledgeQuery {
  productId: string;
  intent: 'summary' | 'similar' | 'nav' | 'search';
  scopeId: string;
  text: string;
  limit?: number;
  filters?: {
    paths?: string[];
    tags?: string[];
    mimeTypes?: string[];
  };
}

/**
 * Knowledge API result interface
 */
export interface KnowledgeResult {
  query: KnowledgeQuery;
  chunks: Array<{
    text: string;
    path: string;
    score: number;
    metadata?: Record<string, unknown>;
  }>;
  contextText?: string;
  engineId?: string;
}

export interface MindQueryResult {
  success: boolean;
  context?: string;
  chunks?: Array<{
    text: string;
    path: string;
    score: number;
  }>;
  error?: string;
}

/**
 * Query knowledge using Knowledge API (primary) or CLI fallback
 */
export async function queryKnowledge(
  query: string,
  options: {
    cwd: string;
    ctx?: PluginRuntimeContext;
    maxTokens?: number;
  },
): Promise<MindQueryResult> {
  // Primary: Use Knowledge API if runtime context available
  if (options.ctx?.knowledge) {
    try {
      const result = await options.ctx.knowledge.query({
        productId: 'playbooks',
        intent: 'search',
        scopeId: 'default',
        text: query,
        limit: options.maxTokens ? Math.ceil(options.maxTokens / 100) : 10,
      });

      // Truncate contextText to maxTokens
      const maxChars = (options.maxTokens || 2000) * 4;
      const truncated =
        result.contextText && result.contextText.length > maxChars
          ? result.contextText.slice(0, maxChars) + '\n// ... (truncated)'
          : result.contextText;

      return {
        success: true,
        context: truncated,
        chunks: result.chunks.map((c) => ({
          text: c.text,
          path: c.path,
          score: c.score,
        })),
      };
    } catch (error) {
      // If Knowledge API fails, fall through to CLI fallback
      console.warn(`Knowledge API failed, falling back to CLI: ${error}`);
    }
  }

  // Fallback: Use CLI for standalone usage (e.g., testing, direct CLI invocation)
  return queryMindCLI(query, {
    cwd: options.cwd,
    maxTokens: options.maxTokens,
  });
}

/**
 * Query Mind RAG using CLI (fallback method)
 * @private
 */
async function queryMindCLI(
  query: string,
  options: {
    cwd: string;
    maxTokens?: number;
  },
): Promise<MindQueryResult> {
  return new Promise((resolve) => {
    const args = [
      'kb',
      'mind',
      'rag-query',
      '--text',
      query,
      '--agent', // Clean JSON output
      '--mode',
      'instant', // Fast mode
    ];

    const child = spawn('pnpm', args, {
      cwd: options.cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      if (code !== 0) {
        resolve({
          success: false,
          error: `Mind RAG query failed: ${stderr}`,
        });
        return;
      }

      try {
        // Parse agent JSON response
        const response = JSON.parse(stdout);

        if (response.error) {
          resolve({
            success: false,
            error: response.error.message,
          });
          return;
        }

        // Extract context from chunks
        const chunks = response.results?.chunks || [];
        const contextText = chunks
          .map((chunk: any) => `// ${chunk.path}\n${chunk.text}`)
          .join('\n\n');

        // Truncate to maxTokens (rough estimate: 4 chars = 1 token)
        const maxChars = (options.maxTokens || 2000) * 4;
        const truncated =
          contextText.length > maxChars
            ? contextText.slice(0, maxChars) + '\n// ... (truncated)'
            : contextText;

        resolve({
          success: true,
          context: truncated,
          chunks: chunks.map((c: any) => ({
            text: c.text,
            path: c.path,
            score: c.score || 0,
          })),
        });
      } catch (error) {
        resolve({
          success: false,
          error: `Failed to parse Mind response: ${error}`,
        });
      }
    });
  });
}

/**
 * Query knowledge with multiple queries and merge results
 */
export async function queryKnowledgeMultiple(
  queries: string[],
  options: {
    cwd: string;
    ctx?: PluginRuntimeContext;
    maxTokens?: number;
  },
): Promise<MindQueryResult> {
  const results = await Promise.all(
    queries.map((query) => queryKnowledge(query, options)),
  );

  const successful = results.filter((r: MindQueryResult) => r.success);

  if (successful.length === 0) {
    return {
      success: false,
      error: 'All knowledge queries failed',
    };
  }

  // Merge contexts
  const mergedContext = successful
    .map((r: MindQueryResult) => r.context)
    .filter(Boolean)
    .join('\n\n---\n\n');

  // Merge chunks (deduplicate by path)
  const allChunks = successful.flatMap((r: MindQueryResult) => r.chunks || []);
  const uniqueChunks = Array.from(
    new Map(allChunks.map((c) => [c.path, c])).values(),
  );

  // Truncate merged context
  const maxChars = (options.maxTokens || 2000) * 4;
  const truncated =
    mergedContext.length > maxChars
      ? mergedContext.slice(0, maxChars) + '\n// ... (truncated)'
      : mergedContext;

  return {
    success: true,
    context: truncated,
    chunks: uniqueChunks as Array<{
      text: string;
      path: string;
      score: number;
    }>,
  };
}

/**
 * Execute Mind integration from playbook config
 */
export async function executeMindIntegration(
  mindConfig: MindIntegration,
  context: Record<string, string>,
  options: {
    cwd: string;
    ctx?: PluginRuntimeContext;
  },
): Promise<MindQueryResult> {
  if (!mindConfig.enabled) {
    return {
      success: true,
      context: '',
      chunks: [],
    };
  }

  // Interpolate queries with context
  const interpolatedQueries = mindConfig.queries.map((query) => {
    let interpolated = query;
    for (const [key, value] of Object.entries(context)) {
      interpolated = interpolated.replace(`{${key}}`, value);
    }
    return interpolated;
  });

  return queryKnowledgeMultiple(interpolatedQueries, {
    cwd: options.cwd,
    ctx: options.ctx,
    maxTokens: mindConfig.maxContextTokens,
  });
}
