<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Self-hosted deployment — do not use `*.asset.json` image imports

This app is cut over to self-hosting (nginx + pm2, `nitro.preset: "node-server"` in
`vite.config.ts`), not served through Lovable's sandbox. Lovable's asset pipeline
(`import shot from "@/assets/.../foo.webp.asset.json"`, then `shot.url`) resolves to
`/__l5e/assets-v1/...`, a path only proxied by `lovableAssetsProxyPlugin` inside
Lovable's own dev sandbox. In this deployment that path 404s, so any new image added
this way ships broken in production (this happened once on the landing/özellikler
pages, fixed in commit `6684610`).

When adding an image (whether editing here or syncing from Lovable's editor): import
the `.webp`/`.png` file directly, e.g. `import shot from "@/assets/features/foo.webp"`,
the same pattern already used in `src/lib/caseLogos.ts` and `src/lib/clientLogos.ts`.
An ESLint rule (`no-restricted-imports` in `eslint.config.js`) and a postbuild check
(`scripts/check-no-lovable-assets.mjs`, wired into `npm run build`) both guard against
this regressing — if either one flags it, fix the import rather than suppressing the check.
