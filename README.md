# sfnxt-ctfl-starter

A Storefront Next starter that renders entirely from Contentful. It is built on [Storefront Next Foundations](https://github.com/SalesforceCommerceCloud/storefront-next-foundations) (React Router 7, React 19, Tailwind CSS 4) with:

- **Contentful content** from a space using the **Demo 2.0** content model: landing pages, product listing and detail pages, navigation, banners, CTAs and collections.
- **Contentful Live Preview** with the inspector: click any field in the preview to open it in the editor.
- **Contentful Personalization (Ninetailed)**: experiences and A/B tests on page sections, commerce event tracking, the preview widget, and a mock sign-in.
- **Multi-brand sites** from one space. The example config serves Rawlings and Easton.
- **A mock cart** in the browser. Salesforce Commerce (SCAPI, SLAS, Page Designer) is disconnected but still in the repo.

## Prerequisites

- **Node.js 24+**: [Download](https://nodejs.org/)
- **pnpm**: `npm install -g pnpm`, or see [pnpm.io](https://pnpm.io/installation)
- A Contentful space with the Demo 2.0 content model, plus its Delivery and Preview API tokens

## Quick start

```bash
# 1. Set up environment
cp .env.default .env
# Fill in the Contentful tokens, preview secret and Ninetailed keys

# 2. Install and run
pnpm install
pnpm dev
```

Visit [http://localhost:5173](http://localhost:5173). It redirects to the default brand at `/rawlings/en-US/`.

To preview drafts with the Live Preview inspector, add your preview secret to any URL:

```text
http://localhost:5173/rawlings/en-US/?cfpreview=<CONTENTFUL_PREVIEW_SECRET>
```

## Documentation

| Doc | What it covers |
| --- | --- |
| [docs/README-CONTENTFUL.md](./docs/README-CONTENTFUL.md) | Environment variables, connecting your own space, brand scoping, routes, Live Preview and content preview URLs, personalization, mock cart |
| [docs/README-DEMO-2.0-CONTENT-MODEL.md](./docs/README-DEMO-2.0-CONTENT-MODEL.md) | All 50 Demo 2.0 content types, what the storefront renders, authoring conventions |
| [docs/README-CONTENTFUL-MIGRATION.md](./docs/README-CONTENTFUL-MIGRATION.md) | Every change from upstream Foundations, and how to re-apply it to a newer release |
| [contentful/demo-2.0/content-types.json](./contentful/demo-2.0/content-types.json) | Field-level snapshot of the Demo 2.0 content model |
| [AGENTS.md](./AGENTS.md) | Rules for AI coding agents and the full docs index |

## Configuration

Contentful spaces, brands and personalization are configured in `config.server.base.ts` (`app.contentful`, `app.personalization`). Brand sites and security headers are in `config.server.ts`. Secrets live in `.env`. See [docs/README-CONTENTFUL.md](./docs/README-CONTENTFUL.md#environment).

Any config path can also be set with a `PUBLIC__` environment variable, using double underscores (`__`) as separators:

```bash
# Environment variable                                    →  Config path
PUBLIC__app__contentful__spaces__brand__environment=staging →  config.app.contentful.spaces.brand.environment
```

`PUBLIC__` values are sent to the browser. Never use the prefix for tokens. See the [Configuration Guide](./docs/README-CONFIG.md) for complete documentation.

## Deployment

Deploy to Salesforce B2C Commerce's Managed Runtime. First uncomment and set the `MRT_*` variables in `.env`, and set the Contentful and Ninetailed variables on the Managed Runtime environment.

```bash
pnpm build
pnpm push
```

For a deployed environment, add a content preview environment in Contentful that points at the deployed host (see [Content preview URLs](./docs/README-CONTENTFUL.md#content-preview-urls)).

`pnpm push` reads `MRT_PROJECT` and `MRT_ENVIRONMENT` (`MRT_TARGET` is still accepted) from `.env`. Choose the Managed Runtime API with `--mrt-backend` (or `MRT_BACKEND`):

| Backend | Credentials |
|---|---|
| `legacy` (default) | MRT API key (`MRT_API_KEY` or `~/.mobify`) |
| `scapi` | Account Manager API client with the `sfcc.storefront.deployments.rw` scope: `SFCC_CLIENT_ID`, `SFCC_CLIENT_SECRET`, `SFCC_SHORTCODE`, `SFCC_TENANT_ID` |
| `auto` | SCAPI when those are set, otherwise legacy |

See the [Deployment Guide](https://www.npmjs.com/package/@salesforce/storefront-next-dev?activeTab=readme) for all options.

## Available scripts

```bash
# Development
pnpm dev              # Start dev server
pnpm build            # Build for production
pnpm start            # Run production build

# Testing & Quality
pnpm test             # Run tests
pnpm lint             # Lint code
pnpm typecheck        # Check TypeScript

# Storybook
pnpm storybook        # Component explorer
```

## Project structure

```
contentful/demo-2.0/            # Demo 2.0 content model snapshot
src/
├── components/contentful/      # Pages, sections, cards, header/footer, Live Preview runtime
├── components/personalization/ # Ninetailed provider, experiences, mock sign-in
├── components/mock-cart/       # Mini-cart and cart UI
├── lib/contentful/             # Contentful client, queries, brand scoping, preview, inspector
├── lib/personalization/        # Event tracking, mock auth
├── lib/mock-cart/              # Browser cart store
└── routes/                     # Page routes (Commerce routes are ignored in routes.ts)
```

## Upstream

Most framework docs in [docs/](./docs/) come from Storefront Next Foundations unchanged. They also describe Commerce features that are disconnected here. To pick up a newer Foundations release, follow [Re-applying to a newer Foundations release](./docs/README-CONTENTFUL-MIGRATION.md#re-applying-to-a-newer-foundations-release).

## License

See [LICENSE](./LICENSE) for details.
