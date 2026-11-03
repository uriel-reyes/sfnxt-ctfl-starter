# Demo 2.0 Content Model

This storefront is built against the **Demo 2.0** content model: the 50 content types in the connected Contentful space (**Bob Demos**, space `5cee49thobbo`, environment `master`). This page lists every type, how the storefront uses it today, and the authoring conventions the code relies on.

A field-level snapshot of the model (fields, types, validations, allowed values) is checked in at [`contentful/demo-2.0/content-types.json`](../contentful/demo-2.0/content-types.json). Regenerate it when the model changes (see [Refreshing the snapshot](#refreshing-the-snapshot)).

For setup, routes, Live Preview and personalization, see [README-CONTENTFUL.md](./README-CONTENTFUL.md).

## How to read the status column

| Status | Meaning |
| --- | --- |
| **Rendered** | The storefront has a component or route for this type. |
| **Read** | The storefront queries or follows this type (routing, logos, prices, preview data) but has no component of its own for it. |
| **Not used** | Part of the Demo 2.0 model, but the storefront ignores it. Entries of these types render nothing. |

To render a type that is **Not used**, add a component and register it. Sections go in `src/components/contentful/sections/component-renderer.tsx` (and in `SECTION_TYPES`), collection items in `CARDS` in `src/components/contentful/sections/cards.tsx`, and new routed pages in `src/routes/` plus `ROUTE_PREFIXES` in `src/lib/contentful/links.ts`.

## Authoring conventions the storefront relies on

Two brands share the space. The code scopes content to a brand with naming conventions rather than tags (see `src/lib/contentful/brand.ts`):

- **Internal name prefix.** Every brand entry's `internalName` starts with `<contentName> - `, for example `Rawlings2 - Hero` or `Easton - Navigation 1`. Entries without the prefix are invisible to that brand.
- **Slug suffix.** Brand-specific slugs may end in `-<tag>` (`shop-easton`). URLs drop the suffix (`/easton/en-US/shop`), and lookups try the suffixed slug first.
- **Private tags.** Entries also carry `rawlings`, `rawlings2` or `easton` tags. They are private, so the Delivery and Preview APIs don't return them and the code can't filter on them.
- **Navigation order.** Top-level `navigation` entries are ordered by internal name (`… Navigation 1`, `… Navigation 2`).
- **Brand logo.** Each brand's `company` entry is matched by `name`. Its `logo` is shown in the brand tabs unless `logo` is set in the brand's config.
- **Experiences.** `banner`, `callToAction`, `collection`, `alert` and `promotionalOffer` have an `nt_experiences` field. The storefront honors it on page sections (hero and `sections`) through `ExperienceBlock`.

## Content types

### Pages

| Type | Name | Status | How the storefront uses it |
| --- | --- | --- | --- |
| `landingPage` | Landing Page | Rendered | Home (`homeSlug` from brand config) and `/:slug`. Reads `title`, `slug`, `hero` (banner or callToAction), `sections`, `seoMetadata`. In `sections`, `collection`, `callToAction` and `banner` render. `dynamicCollection` and `form` are skipped. |
| `product` | Product | Rendered | PDP at `/products/:slug`, and as a collection card. Reads `name`, `slug`, `teaser`, `media`, `images`, `description`, `categories`, `additionalSections`, `seoMetadata`, and the price from `sku`. |
| `productCategory` | Product Category | Rendered | PLP at `/shop/:slug` (products whose `categories` link to it), and as a collection card. `subcategories` is not shown. |
| `dynamicListingPage` | Dynamic Listing Page | Not used | Listing of one content type (`listingType`: blogPost, policy, event, person, supportArticleCategory, storeLocation). |
| `studioLandingPage` | Studio: Landing Page | Not used | Contentful Studio (Experiences) page. Needs the Experiences SDK. |
| `blogPost` | Blog Post | Not used | |
| `policy` | Policy | Not used | |
| `supportArticle` | Support Article | Not used | |
| `supportArticleCategory` | Support Article Category | Not used | |
| `event` | Event | Not used | |
| `recipe` | Recipe | Not used | Links `featuredProducts`. |
| `storeLocation` | Store Location | Not used | |
| `newsletter` | Newsletter | Not used | Email content, not a web page. |

Links and CTAs may target any of the page types. Only `landingPage`, `product` and `productCategory` resolve to a page. A link to any other page type resolves to `/<slug>`, which returns a 404 because `/:slug` only looks up landing pages.

### Sections

| Type | Name | Status | How the storefront uses it |
| --- | --- | --- | --- |
| `banner` | Banner | Rendered | Hero, section and card. Reads `heading`, `body`, `links` (max 2), `media`, `contentPosition`, `mediaPosition` (Background, Left Half, Right Half), `theme` (Default, Primary, Secondary), `size` (Large, Medium, Small, Full Height), `nt_experiences`. |
| `callToAction` | Call to Action | Rendered | Hero, section and card. Reads `heading`, `body`, `media`, `label`, `internalTarget`, `urlTarget`, `nt_experiences`. `dataProvider` is not read. |
| `collection` | Collection | Rendered | Reads `heading`, `introduction`, `items`, `links`, `theme`, `layout`, `nt_experiences`. Layouts: `Grid`, `Carousel (Full)` (banner carousel) and `Carousel (Multi)` have their own layouts. `Stack` and `Accordion` render as a vertical stack. The code also handles an `Icon Grid` layout that the model doesn't offer. |
| `dynamicCollection` | Dynamic Collection | Not used | Query-driven list (`type`, `limit`, `include`, `exclude`, `displayOrder`). Skipped when placed in `sections`. |
| `form` | Form | Not used | Mock form. Skipped when placed in `sections`. |

### Collection items

`collection.items` accepts 20 types. Items without a card render nothing.

| Type | Name | Status |
| --- | --- | --- |
| `banner`, `callToAction`, `product`, `productCategory` | | Rendered as cards |
| `benefit` | Benefit | Not used |
| `customerReview` | Customer Review | Not used |
| `faqItem` | FAQ Item | Not used |
| `mediaMention` | Media Mention | Not used |
| `quote` | Quote | Not used |
| `stats` | Stats | Not used |
| `person` | Person | Not used |
| `company` | Company | Not used as a card (read for brand logos, see below) |
| `assetWrapper` | Asset Wrapper | Not used |
| `link`, `landingPage`, `blogPost`, `policy`, `supportArticle`, `storeLocation`, `form` | | Not used as cards |

### Media

| Type | Name | Status | How the storefront uses it |
| --- | --- | --- | --- |
| `imageWithFocalPoint` | Image with Focal Point | Rendered | `image`, `altText`. `focalPoint` becomes the CSS `object-position`. |
| `externalImage` | External Image | Rendered | `image.url` from the Bynder DAM app. |
| `wistiaVideo` | Wistia Video | Not used | Allowed in `banner.media`. Renders no media. |
| `youTubeVideo` | YouTube Video | Not used | Allowed in `banner.media`. Renders no media. |
| `assetWrapper` | Asset Wrapper | Not used | |

### Navigation, links and site settings

| Type | Name | Status | How the storefront uses it |
| --- | --- | --- | --- |
| `navigation` | Navigation | Rendered | The brand's top-level entries become the header and footer links (`label`, `target`). `children`, `display` and `icon` are not used. |
| `link` | Link | Rendered | Used in banners, collections and navigation. Reads `label`, `internalTarget`, `externalTarget`, and `eventName` + `eventPayload`, which are sent to personalization on click. `eventType` is not read. |
| `company` | Company | Read | Brand-tab logo (`name`, `logo`). |
| `seo` | SEO | Rendered | Page `<title>`, description, Open Graph image. A `robots` value containing `noindex` marks the page `noindex`. |
| `appSettings` | Global Settings | Not used | Site name, logo, theme tokens, primary and footer navigation, announcements. The storefront takes these from brand config and `navigation` entries instead. |
| `alert` | Alert | Not used | Announcement messages (`type`: Info, Warning, Danger). |
| `microcopy` | Microcopy | Not used | UI strings come from `src/locales/`. |
| `redirect` | Redirect | Not used | |

### Commerce

| Type | Name | Status | How the storefront uses it |
| --- | --- | --- | --- |
| `stockroomProduct` | Stockroom Product | Read | Linked from `product.sku`. `price` and `currencyCode` feed the PDP and mock cart. The Demo 2.0 products have no `sku`, so no prices are shown. |
| `price` | Price | Not used | |
| `coinProduct` | External Product | Not used | |
| `promotionalOffer` | Promotional Offer | Not used | |

### Personalization (Ninetailed)

| Type | Name | Status | How the storefront uses it |
| --- | --- | --- | --- |
| `nt_experience` | Experience | Read | Resolved by the SDK from `nt_experiences` on sections. All experiences are loaded for the preview widget in dev and preview. |
| `nt_audience` | Audience | Read | Loaded for the preview widget. |
| `nt_mergetag` | Merge Tag | Not used | Allowed inline in `banner.body`. Embedded inline entries in rich text render nothing. |

### People, places and forms

| Type | Name | Status |
| --- | --- | --- |
| `person` | Person | Not used |
| `place` | Place | Not used |
| `formStatus` | Form Status | Not used |
| `salesforceForm` | Salesforce Form | Not used |

### App-managed and integrations

| Type | Name | Status |
| --- | --- | --- |
| `brazeConfig` | brazeConfig | Not used. Managed by the Braze app: don't edit. |
| `sapProductDataProvider` | SAP Product Data Provider | Not used |

## Refreshing the snapshot

The snapshot is the published content types from the Content Management API, sorted by ID, with `false` and empty properties removed. It needs a personal access token. Keep it in your shell, never in `.env` on Managed Runtime:

```bash
curl -s "https://api.contentful.com/spaces/<space-id>/environments/master/content_types?limit=1000" \
  -H "Authorization: Bearer $CONTENTFUL_MANAGEMENT_ACCESS_TOKEN" \
| jq --indent 4 '{contentModel: "Demo 2.0", contentTypes: (.items | sort_by(.sys.id) | map({id: .sys.id, name, description, displayField, fields: [.fields[] | with_entries(select(.value != false and .value != [] and .value != null))]}))}' \
> contentful/demo-2.0/content-types.json
pnpm exec biome format --write contentful/demo-2.0/content-types.json
```

The Delivery API also lists content types, but it leaves out `in` validations (allowed values), so use the Management API.
