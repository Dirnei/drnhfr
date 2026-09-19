# dirnhofer.net

Personal site of Christian Dirnhofer. Astro, static, deployed to GitHub Pages.

## Commands

| Command | Does |
| --- | --- |
| `npm run dev` | Local dev server |
| `npm run build` | Production build into `dist/` |
| `npm run check` | Type and template check |
| `npm test` | Unit tests |

## Adding a post

Create `src/content/blog/<lang>/<slug>.md` with the frontmatter fields
required by `src/content.config.ts`. Posts in different languages that say
the same thing share a `translationKey`, which is what links them in the
language switcher.

## Deployment

Every push to `main` runs the same check/test/build/link-check gates as CI
before deploying, via `.github/workflows/deploy.yml`. The custom domain
lives in `public/CNAME`.

## Fonts

The site self-hosts Open Sans and JetBrains Mono; both are licensed under
the SIL Open Font License 1.1. `public/fonts/*.woff2` and the two
`*-LICENSE.txt` files next to them are extracted from the
`@fontsource-variable/open-sans` and `@fontsource-variable/jetbrains-mono`
npm packages (kept as `devDependencies` — not imported at runtime, they only
exist as the provenance of those files). The Impressum pages link to the
licence files.

To refresh the woff2 files after bumping either package version, copy the
`latin` and `latin-ext` `wdth`/`wght` variable-font files (whichever axes the
package ships) from `node_modules/@fontsource-variable/<pkg>/files/` into
`public/fonts/`, and re-copy `LICENSE` to `public/fonts/<pkg>-LICENSE.txt`.
