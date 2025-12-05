# Testing Guide

## Manual Testing

### 1. Test build-prompt Command (Standalone CLI Mode)

**Without Mind Integration (Fast):**
```bash
node -e "
import { buildPromptCommand } from './packages/playbooks-core/dist/index.js';
const result = await buildPromptCommand.run({
  task: 'fix broken imports',
  package: 'mind-engine',
  cwd: process.cwd(),
  skipMind: true,
});
console.log('Result:', result.ok ? 'SUCCESS' : 'FAILED');
console.log('Token count:', result.prompt?.tokenCount);
"
```

**Expected output:**
- ✅ SUCCESS
- ✅ Token count: ~500-600
- ✅ Full prompt with 4 layers (system, policies, domain, task)
- ⚠️ Warning: "Knowledge query failed" (expected when skipMind=true)

**With Mind Integration (CLI Fallback):**
```bash
node -e "
import { buildPromptCommand } from './packages/playbooks-core/dist/index.js';
const result = await buildPromptCommand.run({
  task: 'fix broken imports',
  package: 'mind-engine',
  cwd: process.cwd(),
  skipMind: false,  // Enable Mind!
});
console.log('Result:', result.ok ? 'SUCCESS' : 'FAILED');
console.log('Token count:', result.prompt?.tokenCount);
"
```

**Expected output:**
- ✅ SUCCESS
- ✅ Token count: ~2000-3000 (with Mind context injected)
- ✅ Full prompt with context section from Mind RAG
- ⏱️ Takes ~30-60 seconds (Mind RAG query via CLI spawn)

### 2. Test Playbook Resolution

**List all playbooks:**
```bash
node -e "
import { list } from './packages/playbooks-core/dist/index.js';
await list.run({ cwd: process.cwd() });
"
```

**Expected output:**
```
Found 3 playbook(s):

  refactor.fix-imports
    Scope: task | Priority: 3
    Tags: refactoring, imports, dependencies

  domain.refactoring
    Scope: domain | Priority: 2
    Tags: refactoring, code-quality, architecture

  system.base-directives
    Scope: system | Priority: 1
    Tags: system, foundation, directives
```

**Resolve playbook for task:**
```bash
node -e "
import { resolve } from './packages/playbooks-core/dist/index.js';
await resolve.run({
  task: 'fix broken imports',
  cwd: process.cwd(),
});
"
```

**Expected output:**
```
✅ Resolved playbook:

  ID: refactor.fix-imports
  Score: 21
  Reason: Score: 21 (priority: 3)
  Description: Fix broken imports in a package...
```

### 3. Test Knowledge API Integration (When Runtime Context Available)

**Simulated Plugin Handler Test:**
```typescript
// This would be in a plugin handler where ctx is available
import { buildPromptForTask } from '@kb-labs/playbooks-core';

export async function handler(input, ctx: PluginRuntimeContext) {
  const result = await buildPromptForTask(
    'fix broken imports',
    playbooks,
    {
      cwd: process.cwd(),
      ctx,  // Runtime provides ctx.knowledge
      packageName: 'mind-engine',
      context: { packageName: 'mind-engine' },
    }
  );

  // Should use Knowledge API instead of CLI fallback
  // Much faster: ~1-5s vs ~30-60s
}
```

## Unit Testing

### Test Mind Client

```typescript
import { queryKnowledge, type PluginRuntimeContext } from '@kb-labs/playbooks-core';

// Mock Knowledge API
const mockCtx: PluginRuntimeContext = {
  knowledge: {
    query: async (query) => ({
      query,
      chunks: [
        {
          text: 'Example code',
          path: 'src/example.ts',
          score: 0.9,
        },
      ],
      contextText: '// src/example.ts\nExample code',
      engineId: 'mock',
    }),
  },
};

// Test with Knowledge API
const result = await queryKnowledge('test query', {
  cwd: process.cwd(),
  ctx: mockCtx,
  maxTokens: 1000,
});

expect(result.success).toBe(true);
expect(result.context).toContain('Example code');
```

### Test CLI Fallback

```typescript
// Test without ctx - should use CLI fallback
const result = await queryKnowledge('test query', {
  cwd: process.cwd(),
  // ctx: undefined → triggers CLI fallback
  maxTokens: 1000,
});

// Should still work but slower
expect(result.success).toBe(true);
```

## Integration Testing

### Test Full Pipeline

```typescript
import { loadAllPlaybooks, buildPromptForTask } from '@kb-labs/playbooks-core';

// Load playbooks
const playbooks = await loadAllPlaybooks('./playbooks');
expect(playbooks.length).toBeGreaterThan(0);

// Build prompt without Mind
const result = await buildPromptForTask(
  'fix broken imports',
  playbooks,
  {
    cwd: process.cwd(),
    packageName: 'test-package',
    context: { packageName: 'test-package' },
  }
);

expect(result).not.toBeNull();
expect(result!.fullPrompt).toContain('fix-imports');
expect(result!.tokenCount).toBeGreaterThan(100);
```

## Performance Benchmarks

### Knowledge API vs CLI Fallback

| Mode | Time | Use Case |
|------|------|----------|
| **Knowledge API** (in-process) | ~1-5s | Plugin handlers with runtime context |
| **CLI Fallback** (spawn) | ~30-60s | Standalone CLI commands |
| **Skip Mind** | ~50-100ms | Testing, dry-run |

### Token Limits

| Configuration | Tokens | Use Case |
|---------------|--------|----------|
| System only | ~100 | Minimal context |
| System + Domain | ~200 | Domain strategies |
| System + Domain + Task | ~500 | Full playbook |
| With Mind context | ~2000+ | Semantic code context |

## Troubleshooting

### "Knowledge query failed" Warning

**Cause:** Mind integration attempted but failed (ctx unavailable or CLI spawn failed)

**Solution:**
- If testing: Use `skipMind: true`
- If in plugin: Ensure `ctx` is passed through
- If CLI: This is expected behavior (graceful degradation)

### "No playbooks found" Error

**Cause:** `playbooks/` directory not found

**Solution:**
```bash
# Ensure playbooks directory exists
ls -la playbooks/

# Should contain:
# - system/
# - domains/
# - tasks/
# - packages/
# - policies/
```

### TypeScript Compilation Errors

**Cause:** Missing type definitions or imports

**Solution:**
```bash
# Rebuild packages
pnpm --filter @kb-labs/playbooks-core build

# Check types
pnpm --filter @kb-labs/playbooks-core exec tsc --noEmit
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Test Playbooks

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3

      - name: Install dependencies
        run: pnpm install

      - name: Build playbooks
        run: pnpm --filter @kb-labs/playbooks-core build

      - name: Test build-prompt (without Mind)
        run: |
          node -e "
          import { buildPromptCommand } from './packages/playbooks-core/dist/index.js';
          const result = await buildPromptCommand.run({
            task: 'fix broken imports',
            cwd: process.cwd(),
            skipMind: true,
          });
          if (!result.ok) process.exit(1);
          "

      - name: Test playbook resolution
        run: |
          node -e "
          import { list } from './packages/playbooks-core/dist/index.js';
          await list.run({ cwd: process.cwd() });
          "
```

---

**Last Updated:** 2025-12-03
**Status:** Manual testing functional, unit tests pending
