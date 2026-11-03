# Contentful-Only Storefront (Demo 2.0)

This storefront renders entirely from Contentful. It does not call Salesforce Commerce (SCAPI, SLAS, or Page Designer). It reads a space built on the **Demo 2.0** content model. Every content type, and whether the storefront renders it, is listed in [README-DEMO-2.0-CONTENT-MODEL.md](./README-DEMO-2.0-CONTENT-MODEL.md). The changes from upstream Storefront Next Foundations are in [README-CONTENTFUL-MIGRATION.md](./README-CONTENTFUL-MIGRATION.md).

The example configuration serves two brands, Rawlings and Easton, from one Demo 2.0 space (**Bob Demos**, `5cee49thobbo`):

| Brand | URL | Home entry slug |
| --- | --- | --- |
| Rawlings (default) | `/rawlings/en-US/` | `home-rawlings2` (the `Rawlings2 - …` content set) |
| Easton | `/easton/en-US/` | `home-easton` |

`/` redirects to Rawlings. The tabs at the top right switch brands with a full page load, because each brand has its own navigation, personalization profile and cart.

Logos come from each brand's Contentful `company` entry. A brand's `logo` in `config.server.base.ts` overrides it: Rawlings uses the self-hosted script wordmark in `public/images/brands/`. Each brand's primary color (buttons, badges, focus rings) is set in `src/theme/overrides/brands.css`, keyed on `<html data-brand>`.

## Environment

Copy `.env.default` to `.env` and set these (never commit `.env`):

| Variable | Purpose |
| --- | --- |
| `CONTENTFUL_BRAND_DELIVERY_TOKEN` | Content Delivery API token for the `brand` space (published content). Required. |
| `CONTENTFUL_BRAND_PREVIEW_TOKEN` | Content Preview API token. Needed only for draft preview. |
| `CONTENTFUL_PREVIEW_SECRET` | Shared secret that turns on preview (see below). Needed only for draft preview. |
| `PUBLIC__app__personalization__clientId` | Ninetailed (Contentful Personalization) API key. Personalization is inert without it. |
| `PUBLIC__app__personalization__environment` | Ninetailed environment, e.g. `main`. |

Token variable names follow the space key in `config.server.base.ts` (`app.contentful.spaces`): `brand` gives `CONTENTFUL_BRAND_*`. The space ID and environment live in the same config block. Override the environment with `PUBLIC__app__contentful__spaces__brand__environment`.

`CONTENTFUL_PAGE_CACHE_TTL_MS` (optional, default `60000`) sets how long published content is cached per instance. `0` turns the cache off.

The app never reads a Contentful management token. You only need one, in your shell, to [refresh the content model snapshot](./README-DEMO-2.0-CONTENT-MODEL.md#refreshing-the-snapshot). Never set it on Managed Runtime.

The Salesforce variables (`PUBLIC__app__commerce__api__*`, `MRT_*`) are commented out in `.env.default`. Startup doesn't require Commerce credentials, and nothing calls Commerce. Uncomment them only to reconnect Commerce routes or to deploy with `pnpm push`.

## Connect your own Demo 2.0 space

1. Create or choose a space with the Demo 2.0 content model. You can compare it with [`contentful/demo-2.0/content-types.json`](../contentful/demo-2.0/content-types.json).
2. In **Settings → API keys**, create a key, then set `CONTENTFUL_BRAND_DELIVERY_TOKEN` and `CONTENTFUL_BRAND_PREVIEW_TOKEN` from it.
3. In `config.server.base.ts`, set `app.contentful.spaces.brand.spaceId` and `environment`. Then define your brands in `app.contentful.brands`, keyed by site ID: `name`, `tag`, `homeSlug`, and optionally `contentName` and `logo`.
4. In `config.server.ts`, list one site per brand in `commerce.sites`, and set `defaultSiteId` and `siteAliasMap`. Add a `[data-brand='<siteId>']` block for each brand in `src/theme/overrides/brands.css`.
5. Author entries with the brand's internal-name prefix (`<contentName> - …`). Create a `landingPage` with the brand's `homeSlug`, top-level `navigation` entries, and a `company` entry named after the brand for its logo.
6. Choose a `CONTENTFUL_PREVIEW_SECRET`, then set up the content preview URL (see [Content preview URLs](#content-preview-urls)).
7. For personalization, copy the Ninetailed API key and environment into `PUBLIC__app__personalization__clientId` / `__environment`.

## How content is scoped to a brand

Both brands' entries carry a Contentful tag (`rawlings` or `easton`), but those tags are **private**. The Delivery and Preview APIs never return private tags, so the app cannot filter by them. Scoping relies on the authoring convention both brands already follow instead:

- Every entry's **internal name** starts with `<Brand> - ` (for example `Rawlings - Hero`). `belongsToBrand()` in `src/lib/contentful/brand.ts` filters on this prefix.
- Brand-specific **slugs** may end in `-<tag>` (for example `shop-rawlings`). URLs drop the suffix (`/rawlings/en-US/shop`). Lookups try `shop-rawlings` first, then `shop`.

A brand can serve an alternate content set under the same name. Rawlings sets `contentName: 'Rawlings2'`, `tag: 'rawlings2'` and `homeSlug: 'home-rawlings2'`, so it reads `Rawlings2 - …` entries and `-rawlings2` slugs while the site still shows "Rawlings". To return to the original set, remove `contentName` and set `tag` back to `rawlings` and `homeSlug` back to `home-rawlings`.

If you make the tags public in Contentful, you can switch the queries in `src/lib/contentful/content.server.ts` to `metadata.tags.sys.id[in]`.

## Routes

| Route | Content type | File |
| --- | --- | --- |
| `/` (per brand) | `landingPage` with the brand's `homeSlug` | `src/routes/_app._index.tsx` |
| `/:slug` | `landingPage` | `src/routes/_app.$slug.tsx` |
| `/shop/:slug` | `productCategory` (PLP: products that link to the category) | `src/routes/_app.shop.$slug.tsx` |
| `/products/:slug` | `product` (PDP) | `src/routes/_app.products.$slug.tsx` |
| `/cart` | Mock cart | `src/routes/_app.cart.tsx` |

The navigation and brand tabs load in the `_app` layout loader (`navigation` entries and `company` logos).

Section rendering lives in `src/components/contentful/sections/`. `component-renderer.tsx` maps the `banner`, `collection` and `callToAction` content types to components, and `cards.tsx` maps each card type inside a collection. Add a content type by registering it in those maps. [README-DEMO-2.0-CONTENT-MODEL.md](./README-DEMO-2.0-CONTENT-MODEL.md) lists the Demo 2.0 types that aren't rendered yet.

### Commerce routes are disconnected, not deleted

`COMMERCE_ROUTE_FILES` in `src/routes.ts` lists the template's Commerce routes (account, checkout, SCAPI PLP/PDP, search, login, every action and resource route). They stay in the repo but are not registered, and the Commerce middlewares are not registered in `src/root.tsx`. Remove a pattern to bring a route back.

`react-router typegen` still registers every route, because the template's components import those routes' generated `+types`. That keeps `pnpm typecheck` green. The dev server's on-the-fly typegen uses the served route list, so your editor may show stale type errors in the disconnected route files until you run `pnpm typecheck` again.

## Live Preview

Append `?cfpreview=<CONTENTFUL_PREVIEW_SECRET>` to any URL, for example:

```text
http://localhost:5173/rawlings/en-US/?cfpreview=<secret>
```

With a valid secret, the request:

- reads drafts from the Preview API with Content Source Maps,
- lazy-loads the Live Preview SDK with inspector mode and live updates enabled, and re-runs the route loaders as soon as the editor reports a save, so the page is always a server render of the latest draft. The editor autosaves about every 5 seconds, so an edit typically appears 1–6 seconds after it is made. Saves are read from the editor's messages for any entry, because the SDK's own `save` subscription ignores entries not tagged on the page, such as a collection whose items were reordered. Edits don't wait for that reload: `useLiveEntry` subscribes each rendered entry (sections, heroes, products, categories) to the editor's live updates, so changes render as they're typed, and a save reload that reaches the Preview API late never undoes them. `useLiveOrder` follows the editor's order of a page's `sections` (or `additionalSections`) the moment they are dragged, reordering the loader's entries by ID rather than taking the list from the editor's merged graph, which drifts out of step when references are reordered,
- marks the page `noindex`,
- carries `cfpreview` on internal links, so the session stays in preview as you click around.

Without the secret, or with a wrong one, the page is the published site, and the SDK is never downloaded.

### Content preview URLs

Both brands share one space, and a URL template can't tell which brand an entry belongs to or which page shows it. So every content type in Contentful (**Settings → Content preview**) uses the same template:

```text
http://localhost:5173/rawlings/en-US/contentful-preview?id={entry.sys.id}&cfpreview=<secret>
```

`src/routes/contentful-preview.ts` finds the page for the entry (`src/lib/contentful/preview-target.server.ts`) and redirects to it in preview:

- Landing pages, products and categories open their own page.
- Any other entry opens the nearest page that links to it (up to four link levels up, e.g. link → card → section → page).
- If no page links to the entry, it opens the brand's home page.
- The brand comes from the internal-name prefix of the page, or of the entry itself, so the `rawlings` segment in the template doesn't decide the site.

The space's **Storefront Foundations (local)** preview environment is set up this way. For a deployed environment, add another preview environment with the same template on that host.

The CSP in `config.server.ts` allows `app.contentful.com` to frame the site, and the Ninetailed preview widget origin to load.

## Personalization (Ninetailed)

`src/components/personalization/` wraps the app in `NinetailedProvider` with the insights plugin. In `pnpm dev`, and in preview, it also adds the preview plugin: the floating widget lets you force audiences and variants.

- **Experiences**: the page hero renders through `ExperienceBlock`. Both brands' heroes are 50/50 A/B experiments with no audience, so a new visitor may see either variant. Use **Reset profile** in the sign-in dialog to re-roll.
- **Tracking**: page views on navigation, plus `productViewed`, `categoryViewed`, `productAdded`, `productRemoved`, `cartViewed`, `checkoutStarted` and `orderCompleted`. Every event carries a `brand` property (`src/lib/personalization/use-commerce-tracking.ts`).
- **Mock sign-in**: the header's **Sign in** calls `identify` with a demo shopper (`jordan@example.com`) and traits you can target audiences on. See `src/lib/personalization/mock-auth.ts`.

## Mock cart

`src/lib/mock-cart/` stores the cart in `localStorage`, one cart per brand. Adding an item opens the mini-cart, and **Place demo order** on `/cart` fires `orderCompleted` and empties the cart.

The products in this space have no `sku` or price, so the cart shows quantities without totals. If a product has a `sku` entry with a price, the cart picks the price up automatically (`src/lib/contentful/product.ts`).
