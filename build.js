import { build } from 'esbuild';

await build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  outfile: 'extension/index.js',
});

await build({
  entryPoints: ['src/intercept.ts'],
  bundle: true,
  outfile: 'extension/intercept.js',
});

await build({
  entryPoints: ['src/bridge.ts'],
  bundle: true,
  outfile: 'extension/bridge.js',
});

await build({
  entryPoints: ['src/popup.ts'],
  bundle: true,
  outfile: 'extension/popup.js',
});
