# Knowledge API Integration

## Overview

The playbooks plugin now uses **Knowledge API** instead of direct Mind RAG CLI calls for semantic code search and context injection. This provides a universal abstraction layer that:

- ✅ Decouples from Mind implementation details
- ✅ Works with any RAG engine through unified interface
- ✅ Supports both plugin runtime (in-process) and standalone CLI usage
- ✅ Enables graceful degradation when services unavailable

## Architecture

```
Playbook YAML
  │
  ├─ mindIntegration.queries: ["query {packageName}", ...]
  │
  └─> executeMindIntegration()
        │
        ├─ Interpolate variables: {packageName} → "mind-engine"
        │
        └─> queryKnowledgeMultiple()
              │
              ├─ PRIMARY: ctx.knowledge.query() (Knowledge API)
              │   └─ In-process call to knowledge service
              │
              └─ FALLBACK: pnpm kb mind rag-query (CLI spawn)
                  └─ Direct CLI invocation for standalone usage
```

## Implementation

### 1. Knowledge API Client (`mind-client.ts`)

**Primary Method:** `queryKnowledge()`
```typescript
export async function queryKnowledge(
  query: string,
  options: {
    cwd: string;
    ctx?: PluginRuntimeContext; // Optional runtime context
    maxTokens?: number;
  }
): Promise<MindQueryResult>
```

**Flow:**
1. **If `ctx.knowledge` available**: Use Knowledge API
   - Creates `KnowledgeQuery` with intent='search'
   - Calls `ctx.knowledge.query()`
   - Returns structured `KnowledgeResult`
2. **Else**: Fallback to CLI spawn
   - Spawns `pnpm kb mind rag-query`
   - Parses JSON output
   - Returns compatible result

### 2. Interfaces

**Plugin Runtime Context:**
```typescript
export interface PluginRuntimeContext {
  knowledge?: {
    query(query: KnowledgeQuery): Promise<KnowledgeResult>;
    index?(scopeId: string, options?: { force?: boolean }): Promise<void>;
  };
}
```

**Knowledge Query:**
```typescript
export interface KnowledgeQuery {
  productId: string;      // 'playbooks'
  intent: 'search';       // Query intent
  scopeId: string;        // 'default'
  text: string;           // Semantic query
  limit?: number;         // Max results
  filters?: {             // Optional filters
    paths?: string[];
    tags?: string[];
    mimeTypes?: string[];
  };
}
```

**Knowledge Result:**
```typescript
export interface KnowledgeResult {
  query: KnowledgeQuery;
  chunks: Array<{
    text: string;
    path: string;
    score: number;
    metadata?: Record<string, unknown>;
  }>;
  contextText?: string;   // Pre-formatted context
  engineId?: string;      // Which engine handled query
}
```

### 3. Prompt Builder Integration

**Updated Options:**
```typescript
export interface BuildPromptWithMindOptions extends BuildPromptOptions {
  cwd: string;
  ctx?: PluginRuntimeContext; // NEW: Runtime context
  context?: Record<string, string>;
  skipMind?: boolean;
}
```

**Usage in `buildPromptWithMind()`:**
```typescript
const mindResult = await executeMindIntegration(
  options.mainPlaybook.mindIntegration,
  options.context || {},
  {
    cwd: options.cwd,
    ctx: options.ctx, // Pass through runtime context
  }
);
```

## Usage Examples

### From CLI Command (Standalone)

```typescript
// CLI doesn't have runtime context, uses CLI fallback
const result = await buildPromptForTask(
  'fix broken imports',
  playbooks,
  {
    cwd: process.cwd(),
    // ctx: undefined → will use CLI fallback
    context: { packageName: 'mind-engine' },
  }
);
```

### From Plugin Handler (Runtime)

```typescript
// Plugin handler has runtime context, uses Knowledge API
export async function executePlaybook(
  input: ExecutePlaybookInput,
  ctx: PluginRuntimeContext
): Promise<ExecutePlaybookResult> {
  const result = await buildPromptForTask(
    input.task,
    playbooks,
    {
      cwd: input.cwd,
      ctx, // Runtime provides Knowledge API
      context: { packageName: input.packageName },
    }
  );
}
```

## Benefits

### 1. Abstraction
- **Decoupled**: Not tied to Mind implementation
- **Universal**: Works with any RAG engine
- **Swappable**: Platform can change engine without breaking playbooks

### 2. Performance
- **In-process**: No CLI spawn overhead when runtime available
- **Fast**: Direct function calls vs process creation
- **Efficient**: Reuses existing runtime infrastructure

### 3. Flexibility
- **Dual-mode**: Works both standalone and in runtime
- **Graceful**: Falls back when Knowledge API unavailable
- **Compatible**: Existing CLI workflows continue working

### 4. Future-proof
- **Extensible**: Easy to add new RAG engines
- **Versioned**: Knowledge API can evolve independently
- **Maintainable**: Clear separation of concerns

## Migration Notes

### Breaking Changes
- `executeMindIntegration()` now requires `options.ctx` parameter (optional)
- `buildPromptWithMind()` accepts `ctx` in options
- `buildPromptForTask()` accepts `ctx` in options

### Backward Compatibility
- All `ctx` parameters are **optional**
- Automatically falls back to CLI when `ctx` not provided
- Existing CLI commands work without changes

## Testing Strategy

### Unit Tests
- Test `queryKnowledge()` with mock `ctx.knowledge`
- Test CLI fallback when `ctx` undefined
- Test variable interpolation in queries
- Test token truncation logic

### Integration Tests
- Test with actual Knowledge API implementation
- Test CLI fallback with real `pnpm kb mind rag-query`
- Test end-to-end prompt building with context injection

### E2E Tests
- Run playbook from CLI (tests fallback)
- Run playbook from plugin handler (tests Knowledge API)
- Verify context is correctly injected in both modes

## Related Files

**Core Implementation:**
- `packages/playbooks-core/src/utils/mind-client.ts` - Knowledge API client
- `packages/playbooks-core/src/core/prompt-builder-with-mind.ts` - Prompt builder integration

**CLI Commands:**
- `packages/playbooks-core/src/cli/commands/build-prompt.ts` - Uses standalone mode (CLI fallback)

**Contracts:**
- `packages/playbooks-contracts/src/schema.ts` - Will need Knowledge API types export

## Next Steps

1. **Add proper type imports** - Import `PluginRuntimeContext` from plugin-runtime package
2. **Update CLI commands** - Ensure they work with new signatures (optional ctx)
3. **Add tests** - Unit tests for Knowledge API integration
4. **Update documentation** - Add examples for both usage modes
5. **Implement plugin handlers** - REST/workflow handlers that provide ctx

---

**Implementation Date:** 2025-12-03
**Architect:** Claude (AI Assistant)
**Status:** Core implementation complete, testing pending
