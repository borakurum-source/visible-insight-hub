#!/usr/bin/env node
// Fails the build if the compiled output still references Lovable's sandbox-only
// asset CDN proxy (/__l5e/assets-v1/...). That proxy only resolves inside Lovable's
// dev sandbox (see @lovable.dev/vite-tanstack-config's lovableAssetsProxyPlugin,
// which is a no-op unless LOVABLE_PREVIEW_HOST is set). This app is self-hosted
// (nginx + pm2, nitro preset "node-server"), so any `*.asset.json` import that
// resolves to `/__l5e/...` ships a broken image to production.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const OUTPUT_DIR = ".output";
const NEEDLE = "__l5e";

function walk(dir, hits) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      walk(full, hits);
    } else if (/\.(js|mjs|html|css)$/.test(entry)) {
      const content = readFileSync(full, "utf8");
      if (content.includes(NEEDLE)) hits.push(full);
    }
  }
}

const hits = [];
try {
  walk(OUTPUT_DIR, hits);
} catch (err) {
  console.error(`check-no-lovable-assets: could not scan ${OUTPUT_DIR}: ${err.message}`);
  process.exit(1);
}

if (hits.length > 0) {
  console.error(
    `\nBuild references Lovable's sandbox-only asset CDN (${NEEDLE}) in:\n` +
      hits.map((f) => `  - ${f}`).join("\n") +
      `\n\nThis only resolves inside Lovable's dev sandbox and will 404 in production.\n` +
      `Fix: import the local .webp/.png file directly instead of a *.asset.json manifest\n` +
      `(see src/lib/caseLogos.ts or src/lib/clientLogos.ts for the pattern).\n`,
  );
  process.exit(1);
}

console.log("check-no-lovable-assets: OK (no __l5e references in build output)");
