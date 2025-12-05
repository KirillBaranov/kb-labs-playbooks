# ADR-0009: Lazy Setup on First Command

**Date:** 2025-12-03
**Status:** Accepted
**Deciders:** Kirill Baranov, Claude
**Last Reviewed:** 2025-12-03
**Implemented:** 2025-12-03
**Tags:** platform, lifecycle, setup, state-broker

## Context

KB Labs plugins can declare a `setup` handler in their manifest (`manifest.setup`) that initializes workspace structure (creates directories, writes config files, etc.). The platform must decide **when** to invoke this setup handler.

### Current State
- Plugins are auto-discovered through workspace scanning (`kb plugins list`)
- Setup handler is declared in manifest but no automatic invocation exists
- Auto-generated `plugin:setup` command exists but fails to execute (platform stabilization in progress)

### Requirements
1. **Don't slow down discovery** - workspace scanning and plugin registration must remain fast
2. **Work for marketplaces** - when user installs plugin from marketplace, setup should happen automatically
3. **Work for local development** - when developer adds plugin to workspace, setup should happen automatically
4. **Allow re-running setup** - for debugging or resetting plugin state
5. **Handle failures gracefully** - setup errors shouldn't break CLI or discovery

### Problem
Setup needs to run exactly once, but there's no clear trigger point:
- **Discovery time?** ❌ Would slow down `kb plugins list` and workspace scanning
- **Install time?** ❌ Doesn't work for non-npm plugins (marketplace, git clones)
- **Explicit command?** ❌ User must remember to run `kb plugin:setup` (poor UX)

## Decision

Implement **lazy setup on first command invocation** with persistent state tracking via State Broker.

### How It Works

```typescript
// In CLI command dispatcher (before executing any plugin command)
async function dispatchCommand(namespace: string, command: string, args: any) {
  const plugin = registry.getPlugin(namespace);

  // Check if setup was already done (persistent state)
  const setupState = await stateBroker.get(`plugin:${plugin.id}:setup-done`);

  if (!setupState && plugin.manifest.setup) {
    console.log(`⚙️  First time using ${plugin.id}, running setup...`);

    const setupHandler = await loadSetupHandler(plugin.manifest.setup.handler);
    const result = await setupHandler.run({}, createSetupContext(plugin));

    if (result.ok) {
      await stateBroker.set(
        `plugin:${plugin.id}:setup-done`,
        { timestamp: Date.now(), version: plugin.manifest.version },
        Infinity // Persist forever
      );
      console.log(`✅ ${result.message}`);
    } else {
      console.error(`❌ Setup failed: ${result.error}`);
      process.exit(1);
    }
  }

  // Execute actual command
  return executeCommand(namespace, command, args);
}
```

### State Storage

- **Key pattern:** `plugin:{plugin-id}:setup-done`
- **Value:** `{ timestamp: number, version: string }`
- **TTL:** `Infinity` (persists across daemon restarts)
- **Backend:** State Broker (in-memory + optional persistence)

### Reset Mechanism

Users can force re-running setup:

```bash
# Clear state and re-run on next command
kb playbooks --reset-setup list

# Or use explicit setup command
kb playbooks:setup --force
```

## Consequences

### Positive

- ✅ **Fast discovery** - setup doesn't slow down workspace scanning
- ✅ **Automatic for marketplaces** - download plugin → use command → setup runs
- ✅ **Automatic for local dev** - clone repo → use command → setup runs
- ✅ **Persistent state** - uses State Broker, survives daemon restarts
- ✅ **Graceful failures** - setup errors don't break discovery
- ✅ **User visibility** - shows "Running setup..." message
- ✅ **Re-runnable** - can reset and re-run setup anytime

### Negative

- ❌ **First command slower** - first invocation includes setup overhead (~1-5s)
- ❌ **State Broker dependency** - requires State Broker running
- ❌ **No version tracking** - plugin updates don't trigger re-setup (future enhancement)

### Alternatives Considered

1. **Setup during discovery** - Rejected: would slow down `kb plugins list` significantly
2. **Explicit setup command only** - Rejected: poor UX, doesn't work for marketplaces
3. **npm postinstall hook** - Rejected: doesn't work for marketplace plugins
4. **Filesystem state** - Rejected: State Broker already available and faster

## Implementation

### Platform Changes (kb-labs-cli)

```typescript
// src/commands/dispatcher.ts
export async function dispatchPluginCommand(
  namespace: string,
  command: string,
  args: CommandArgs
) {
  const plugin = pluginRegistry.get(namespace);
  if (!plugin) throw new Error(`Plugin not found: ${namespace}`);

  // Lazy setup check
  await ensurePluginSetup(plugin);

  // Execute command
  return executeCommand(plugin, command, args);
}

async function ensurePluginSetup(plugin: Plugin) {
  const setupKey = `plugin:${plugin.id}:setup-done`;
  const setupState = await stateBroker.get(setupKey);

  if (!setupState && plugin.manifest.setup) {
    const handler = await import(plugin.manifest.setup.handler);
    const ctx = createSetupContext(plugin);
    const result = await handler.run({}, ctx);

    if (!result.ok) {
      throw new Error(`Setup failed: ${result.error}`);
    }

    await stateBroker.set(setupKey, {
      timestamp: Date.now(),
      version: plugin.manifest.version
    }, Infinity);
  }
}
```

### Documentation Updates

- [ ] Update plugin development guide (how setup works)
- [ ] Document setup lifecycle in platform docs
- [ ] Add troubleshooting section for setup failures
- [ ] Document `--reset-setup` flag

## References

- [KB Labs State Broker](../../kb-labs-core/packages/state-broker/README.md)
- [Plugin Manifest v2 Spec](../../kb-labs-plugin/docs/manifest-v2.md)
- [AI Docs Plugin Setup Handler](../../kb-labs-ai-docs/packages/ai-docs-plugin/src/setup/handler.ts)

---

**Last Updated:** 2025-12-03
**Next Review:** After platform implementation
