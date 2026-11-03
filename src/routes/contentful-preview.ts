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
import { redirect } from 'react-router';
import type { Route } from './+types/contentful-preview';
import { getConfig } from '@salesforce/storefront-next-runtime/config';
import { buildUrl, siteContext } from '@salesforce/storefront-next-runtime/site-context';
import { PREVIEW_PARAM } from '@/lib/contentful/inspector';
import { resolvePreviewTarget } from '@/lib/contentful/preview-target.server';
import { notFound, requireContentRequest } from '@/lib/contentful/route.server';

/**
 * Entry point for Contentful's content preview URLs: `…/contentful-preview?id={entry.sys.id}&cfpreview=<secret>`.
 * A URL template can't tell which brand an entry belongs to or which page shows it, so this resolves both and
 * redirects to that page in preview. Requests without the preview secret get a 404.
 */
export async function loader(args: Route.LoaderArgs): Promise<never> {
    const req = requireContentRequest(args);
    const search = new URL(args.request.url).searchParams;
    const entryId = search.get('id');
    if (!req.preview || !entryId) notFound();

    const { brand, path } = await resolvePreviewTarget(args, req, entryId);
    const config = getConfig(args.context);
    const localeId = args.context.get(siteContext)?.locale.id ?? config.i18n.fallbackLng;
    const href = buildUrl({
        to: path,
        urlConfig: config.url,
        params: { siteId: config.siteAliasMap?.[brand.siteId] ?? brand.siteId, localeId },
    });
    const query = new URLSearchParams({ [PREVIEW_PARAM]: search.get(PREVIEW_PARAM) ?? '' });
    throw redirect(`${href}?${query.toString()}`);
}
