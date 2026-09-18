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

Every push to `main` builds and deploys via `.github/workflows/deploy.yml`.
The custom domain lives in `public/CNAME`.
