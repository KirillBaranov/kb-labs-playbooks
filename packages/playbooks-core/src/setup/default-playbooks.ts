/**
 * Default playbook templates
 *
 * These are starter templates that will be copied to .kb/playbooks/
 * during setup for users to customize.
 */

export const defaultPlaybooks = {
  'system/base-directives.yml': `id: "system.base-directives"
version: "1.0.0"
scope: "system"
level: "system"
priority: 1

metadata:
  author: "KB Labs"
  tags: ["system", "core", "directives"]
  lastUpdated: "2025-12-04"

description: |
  Base system directives that apply to all AI operations in KB Labs ecosystem.

instructions: |
  # Core Principles
  1. **Always verify before modifying** - Use Mind RAG to search and understand code
  2. **Respect existing patterns** - Follow architectural patterns in the codebase
  3. **Minimize changes** - Make smallest change necessary
  4. **Preserve functionality** - Don't break existing tests
  5. **Document decisions** - Create or update ADRs for architectural choices

policies:
  allowWrite: true
  allowDelete: false
  restrictedPaths:
    - "**/*.config.js"
    - "**/package.json"

mindIntegration:
  enabled: true
  queries:
    - "What are the architectural patterns used in KB Labs?"
    - "Show me similar implementations in the codebase"
  maxContextTokens: 1000
`,

  'tasks/fix-imports.yml': `id: "task.fix-imports"
version: "1.0.0"
scope: "task"
level: "task"
priority: 3

metadata:
  author: "KB Labs"
  tags: ["refactoring", "imports", "dependencies"]
  lastUpdated: "2025-12-04"

description: |
  Fix broken imports in a package by analyzing dependencies and updating import statements.

strategies:
  - "Analyze package.json dependencies"
  - "Scan for broken imports using grep"
  - "Resolve correct import paths"
  - "Update import statements"
  - "Validate with TypeScript"

checks:
  - id: "no-circular-deps"
    description: "Ensure no circular dependencies introduced"
  - id: "no-broken-imports"
    description: "All imports must resolve"

policies:
  allowWrite: true
  allowDelete: false
  restrictedPaths:
    - "core/"

mindIntegration:
  enabled: true
  queries:
    - "Where are similar import fixes implemented?"
  maxContextTokens: 2000
`,

  'tasks/debug-plugin.yml': `id: "task.debug-plugin"
version: "1.0.0"
scope: "task"
level: "task"
priority: 3

metadata:
  author: "KB Labs"
  tags: ["debugging", "plugin", "troubleshooting"]
  lastUpdated: "2025-12-04"

description: |
  Debug plugin issues by analyzing manifest, permissions, and runtime behavior.

strategies:
  - "Check plugin manifest structure"
  - "Verify permissions and capabilities"
  - "Inspect sandbox execution"
  - "Review error logs"
  - "Test with --debug flag"

mindIntegration:
  enabled: true
  queries:
    - "How do plugin permissions work?"
    - "What are common plugin errors?"
  maxContextTokens: 2000
`,

  'domains/refactoring.yml': `id: "domain.refactoring"
version: "1.0.0"
scope: "domain"
level: "domain"
priority: 2

metadata:
  author: "KB Labs"
  tags: ["refactoring", "architecture", "patterns"]
  lastUpdated: "2025-12-04"

description: |
  Cross-cutting refactoring strategies for improving code quality and maintainability.

strategies:
  - "Identify code smells and anti-patterns"
  - "Extract reusable functions and modules"
  - "Apply DRY principle consistently"
  - "Improve naming and clarity"
  - "Update tests to match changes"

policies:
  allowWrite: true
  allowDelete: false
  restrictedPaths:
    - "**/*.test.ts"
    - "**/*.spec.ts"

mindIntegration:
  enabled: true
  queries:
    - "What are the refactoring patterns used in this codebase?"
  maxContextTokens: 2000
`,

  'domains/testing.yml': `id: "domain.testing"
version: "1.0.0"
scope: "domain"
level: "domain"
priority: 2

metadata:
  author: "KB Labs"
  tags: ["testing", "quality", "coverage"]
  lastUpdated: "2025-12-04"

description: |
  Testing strategies and best practices for ensuring code quality.

strategies:
  - "Write unit tests for all new functions"
  - "Add integration tests for workflows"
  - "Maintain >80% code coverage"
  - "Use vitest for testing framework"
  - "Mock external dependencies appropriately"

mindIntegration:
  enabled: true
  queries:
    - "Show me testing patterns in this codebase"
  maxContextTokens: 1500
`,

  'policies/security.yml': `id: "policy.security"
version: "1.0.0"
scope: "policy"
level: "policy"
priority: 5

metadata:
  author: "KB Labs"
  tags: ["security", "safety", "constraints"]
  lastUpdated: "2025-12-04"

description: |
  Security policies and constraints for all operations.

policies:
  allowWrite: true
  allowDelete: false
  restrictedPaths:
    - "**/*.key"
    - "**/*.secret"
    - "**/.env"
    - "**/credentials.json"
  forbiddenActions:
    - "Commit secrets or API keys"
    - "Modify security-critical files without review"
    - "Bypass authentication or authorization"

checks:
  - id: "no-secrets"
    description: "Ensure no secrets in code or commits"
  - id: "secure-dependencies"
    description: "All dependencies must be from trusted sources"
`,

  'packages/mind-engine.yml': `id: "package.mind-engine"
version: "1.0.0"
scope: "package"
level: "package"
priority: 2

metadata:
  author: "KB Labs"
  tags: ["mind", "rag", "search"]
  lastUpdated: "2025-12-04"

description: |
  Package-specific instructions for working with mind-engine package.

instructions: |
  # Mind Engine Guidelines
  - Use Mind RAG for semantic code search
  - Maintain search quality benchmarks
  - Follow ADRs for architecture decisions
  - Test with real-world queries

strategies:
  - "Run benchmarks after search changes"
  - "Update ADRs for major decisions"
  - "Maintain >0.7 confidence scores"

mindIntegration:
  enabled: true
  queries:
    - "How does mind-engine hybrid search work?"
  maxContextTokens: 2500
`,
};
