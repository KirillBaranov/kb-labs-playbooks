import { defineConfig } from 'tsup';
import nodePreset from '@kb-labs/devkit/tsup/node.js';

export default defineConfig({
  ...nodePreset,
  tsconfig: "tsconfig.build.json", // Use build-specific tsconfig without paths
  entry: [
    'src/index.ts',
    'src/manifest.v2.ts',
    'src/lifecycle/setup.ts',
    'src/setup/handler.ts',
    'src/cli/index.ts',
    'src/cli/commands/list.ts',
    'src/cli/commands/resolve.ts',
    'src/cli/commands/build-prompt.ts',
  ],
  external: [
    '@kb-labs/plugin-manifest',
    '@kb-labs/shared-cli-ui',
    'react',
    'react-dom'
  ],
  dts: {
    resolve: true,
    skipLibCheck: true
  },
  esbuildOptions(options) {
    options.jsx = 'automatic';
    return options;
  }
});
