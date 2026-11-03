/**
 * Copyright 2026 Salesforce, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { type RouteConfig } from '@react-router/dev/routes';
import { flatRoutes } from '@salesforce/storefront-next-runtime/routing';

/**
 * Enhanced `flatRoutes` from `@salesforce/storefront-next-runtime/routing`.
 *
 * This is a drop-in wrapper around React Router's stock `flatRoutes` (from
 * `@react-router/fs-routes`) — it accepts the same options (`ignoredRouteFiles`,
 * `rootDirectory`) and returns the same `RouteConfigEntry[]` shape. Internally it
 * delegates to the upstream `flatRoutes` and then layers on three SDK-level behaviors
 * that every storefront depends on:
 *
 * 1. **File-based route discovery** — scans `src/routes/` for route modules, same as the
 *    upstream `flatRoutes`.
 * 2. **Extension route merging** — additionally scans `src/extensions/<name>/routes/` for
 *    routes contributed by optional feature extensions and merges them into the base route
 *    tree. This is what allows extensions to ship their own routes without the template
 *    having to import them explicitly.
 * 3. **Multi-site URL prefixing** — if `app.url.prefix` is configured in `config.server.ts`
 *    (e.g. `/:siteId/:localeId`), wraps every route under that prefix using `app-wrapper.tsx`
 *    so that site- and locale-aware URLs work out of the box. See `docs/README-MULTI-SITE.md`.
 *
 * Test files (`*.test.ts`, `*.test.tsx`) are ignored by default.
 *
 * This storefront renders from Contentful only, so the route modules that need Salesforce Commerce (account,
 * checkout, orders, SCAPI product/category/search pages, login, and every SCAPI-backed action and resource route)
 * stay in the repo but are not registered. Remove a pattern here to bring a route back.
 */
const COMMERCE_ROUTE_FILES = [
    '**/action.*',
    '**/resource.*',
    '**/_checkout*',
    '**/_app.account*',
    '**/_app.about-us.tsx',
    '**/_app.c.$.tsx',
    '**/_app.p.$.tsx',
    '**/_app.cms.$.tsx',
    '**/_app.order-*',
    '**/_app.search.tsx',
    '**/_app.wishlist.tsx',
    '**/_app.store-locator.tsx',
    '**/_empty.$.tsx',
    '**/_empty.forgot-password.tsx',
    '**/_empty.login.tsx',
    '**/_empty.logout.ts',
    '**/_empty.oauth2.jwks.ts',
    '**/_empty.preview.component.tsx',
    '**/_empty.reset-password.tsx',
    '**/_empty.signup.tsx',
];

// `react-router typegen` still sees the disconnected routes: components import their action/loader types, so the
// modules must keep their generated `+types` to type-check.
const isTypegen = process.argv.includes('typegen');

export default flatRoutes({
    ignoredRouteFiles: ['**/*.test.{ts,tsx}', ...(isTypegen ? [] : COMMERCE_ROUTE_FILES)],
}) satisfies RouteConfig;
