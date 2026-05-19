import { readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, relative } from 'node:path';

const distDir = fileURLToPath(new URL('../dist', import.meta.url));
const jsFiles = [];

// Static-asset folders served as-is (e.g. embedded sub-apps like the Cowork
// click-through demo). Any .js inside these is excluded from the
// "single bundle" check because it isn't part of the React app build.
const STATIC_ASSET_DIRS = new Set(['cowork', 'SCM']);

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      const rel = relative(distDir, path).split(/[\\/]/)[0];
      if (STATIC_ASSET_DIRS.has(rel)) continue;
      walk(path);
    } else if (path.endsWith('.js')) {
      jsFiles.push(path);
    }
  }
}

walk(distDir);

if (jsFiles.length !== 1) {
  console.error(`Power Apps build must emit exactly one JavaScript bundle; found ${jsFiles.length}.`);
  for (const file of jsFiles) {
    console.error(` - ${file}`);
  }
  process.exit(1);
}
