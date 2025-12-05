# KB Labs Playbooks

AI instruction and strategy layer for KB Labs ecosystem providing deterministic agent behaviors, cognitive strategies, and orchestrated playbooks.

## Status

**Phase 1 (Foundation)** - ✅ 80% COMPLETE
**Phase 2 (Prompt Building)** - ✅ 70% COMPLETE

**Overall Progress**: 75% ✅

## Features

### ✅ Phase 1 Complete (80%)

- **Playbook Loader**: Load YAML playbooks from filesystem
- **Playbook Resolver**: Smart matching algorithm for task → playbook
- **Prompt Builder**: Layered prompt construction (system + policies + domain + task)
- **Knowledge API Integration**: Dual-mode (in-process + CLI fallback)
- **CLI Commands**:
  - `kb playbooks list` - List all available playbooks
  - `kb playbooks resolve` - Resolve playbook for a task
  - `kb playbooks build-prompt` - Build full prompt with context

### ✅ Phase 2 Complete (70%)

- **Mind RAG Integration**: Knowledge API abstraction layer
- **Context Injection**: Semantic code search with Mind
- **Token Limiting**: Automatic context truncation
- **Variable Interpolation**: `{packageName}` → actual values

### 🎯 Example Playbooks

Eight production-ready playbooks included:

**Tasks** (Priority 3):
- `tasks/fix-imports.yml` - Fix broken imports refactoring
- `tasks/debug-plugin.yml` - Debug plugin handler failures
- `tasks/optimize-workflow.yml` - Optimize workflow performance

**Domains** (Priority 2):
- `domains/refactoring.yml` - Refactoring strategies
- `domains/testing.yml` - Testing best practices

**Packages** (Priority 2):
- `packages/mind-engine.yml` - Mind-specific patterns

**System** (Priority 1):
- `system/base-directives.yml` - Base system directives

**Policies** (Priority 10 - Always Applied):
- `policies/security-restrictions.yml` - Security policies

## Quick Start

### 1. Build

```bash
pnpm install
pnpm -r build
```

### 2. List Playbooks

```bash
node -e "
import { list } from './packages/playbooks-core/dist/index.js';
await list.run({ cwd: process.cwd() });
"
```

Output:
```
Found 8 playbook(s):

  policy.security
    Scope: policy | Priority: 10
    Tags: security, policy, restrictions

  refactor.fix-imports
    Scope: task | Priority: 3
    Tags: refactoring, imports, dependencies

  task.debug-plugin
    Scope: task | Priority: 3
    Tags: debugging, plugin, troubleshooting

  task.optimize-workflow
    Scope: task | Priority: 3
    Tags: optimization, workflow, performance

  domain.refactoring
    Scope: domain | Priority: 2
    Tags: refactoring, code-quality, architecture

  domain.testing
    Scope: domain | Priority: 2
    Tags: testing, quality, vitest

  package.mind-engine
    Scope: package | Priority: 2
    Tags: mind, rag, search

  system.base-directives
    Scope: system | Priority: 1
    Tags: system, foundation, directives
```

### 3. Resolve Playbook

```bash
node -e "
import { resolve } from './packages/playbooks-core/dist/index.js';
await resolve.run({ cwd: process.cwd(), task: 'fix broken imports' });
"
```

Output:
```
✅ Resolved playbook:

  ID: refactor.fix-imports
  Score: 21
  Reason: Score: 21 (priority: 3)
  Description: Fix broken imports in a package by analyzing...
```

## Structure

```
kb-labs-playbooks/
├── packages/
│   ├── playbooks-contracts/    # Public API contracts
│   └── playbooks-core/          # Core implementation
│       ├── src/
│       │   ├── types/           # TypeScript types
│       │   ├── core/            # Business logic
│       │   │   ├── playbook-loader.ts
│       │   │   ├── playbook-resolver.ts
│       │   │   └── prompt-builder.ts
│       │   ├── cli/             # CLI commands
│       │   ├── rest/            # REST handlers (Phase 2)
│       │   ├── lifecycle/       # Setup handler
│       │   └── manifest.v2.ts
│       └── dist/                # Built output
│
└── playbooks/                   # Playbook content
    ├── system/
    ├── tasks/
    ├── domains/
    ├── packages/
    └── policies/
```

## Playbook Format

```yaml
id: "refactor.fix-imports"
version: "1.0.0"
scope: "task"
priority: 3

metadata:
  author: "KB Labs"
  tags: ["refactoring", "imports"]
  lastUpdated: "2025-12-02"

description: |
  Fix broken imports in a package...

strategies:
  - "Use Mind RAG to find similar patterns"
  - "Analyze package.json dependencies"
  - "Update import statements"

checks:
  - id: "no-circular-deps"
    description: "Ensure no circular dependencies"

policies:
  allowWrite: true
  allowDelete: false
  restrictedPaths:
    - "core/**"
  forbiddenActions:
    - "modify package.json scripts"

mindIntegration:
  enabled: true
  queries:
    - "Where are similar import fixes?"
  maxContextTokens: 2000

llmConfig:
  cheapModel: "gpt-4o-mini"
  expensiveModel: "gpt-4o"
  maxRetries: 2
  temperature: 0.2
```

## Documentation

- **[KNOWLEDGE-API-INTEGRATION.md](./KNOWLEDGE-API-INTEGRATION.md)** - Architecture and implementation details
- **[TESTING.md](./TESTING.md)** - Testing guide and examples
- **[IMPLEMENTATION-STATUS.md](./IMPLEMENTATION-STATUS.md)** - Detailed progress tracking

## Roadmap

### ✅ Phase 1: Foundation (80% Complete)
- [x] Playbook loader from YAML
- [x] Playbook resolver with priority matching
- [x] CLI commands (list, resolve, build-prompt)
- [x] 8 production playbooks
- [ ] Unit tests

### ✅ Phase 2: Prompt Building (70% Complete)
- [x] Knowledge API integration
- [x] Layered prompt construction
- [x] Mind RAG context injection
- [x] Token limiting
- [ ] CLI fallback CWD fix
- [ ] More playbooks

### 🚧 Phase 3: LLM Execution
- [ ] OpenAI adapter
- [ ] Cheap-first escalation (gpt-4o-mini → gpt-4o)
- [ ] Retry mechanism
- [ ] Policy validation

### 🚧 Phase 4: Workflow Integration
- [ ] Workflow step handlers
- [ ] REST API endpoints
- [ ] Manifest v2 registration

### 🚧 Phase 5: Studio UI
- [ ] Visual playbook browser
- [ ] Execution monitor
- [ ] Policy editor

## License

MIT
