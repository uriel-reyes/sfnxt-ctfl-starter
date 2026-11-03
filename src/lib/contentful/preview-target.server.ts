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
import type { LoaderFunctionArgs } from 'react-router';
import { getConfig } from '@salesforce/storefront-next-runtime/config';
import { routes } from '@/route-paths';
import { type Brand, belongsToBrand, listBrands } from './brand';
import { type ContentfulClient, queryContentful } from './client.server';
import type { ContentRequest } from './content.server';
import { hrefForEntry } from './links';
import { contentTypeId, type CfEntry } from './types';

type Args = Pick<LoaderFunctionArgs, 'context' | 'request'>;

/** Content types with a storefront URL of their own; any other entry previews on the nearest page linking to it. */
const PAGE_TYPES = new Set(['landingPage', 'product', 'productCategory']);
/** How many link levels to climb looking for that page (e.g. link → card → section → landing page). */
const MAX_DEPTH = 4;
const MAX_PARENTS = 20;

export type PreviewTarget = { brand: Brand; path: string };

async function entries(client: ContentfulClient, query: Record<string, unknown>): Promise<CfEntry[]> {
    const res = await client.getEntries({ include: 0, ...query } as never);
    return res.items as unknown as CfEntry[];
}

/** The entry plus its ancestors, nearest first, up to the first level that contains a page. */
async function climbToPage(client: ContentfulClient, entryId: string): Promise<CfEntry[]> {
    const seen = new Set<string>();
    const visited: CfEntry[] = [];
    let level = await entries(client, { 'sys.id': entryId, limit: 1 });
    for (let depth = 0; level.length > 0 && depth <= MAX_DEPTH; depth++) {
        for (const entry of level) seen.add(entry.sys.id);
        visited.push(...level);
        if (level.some((entry) => PAGE_TYPES.has(contentTypeId(entry)))) break;
        const parents = await Promise.all(
            level.map((entry) => entries(client, { links_to_entry: entry.sys.id, limit: MAX_PARENTS }))
        );
        level = parents.flat().filter((entry, i, all) => {
            if (seen.has(entry.sys.id)) return false;
            return all.findIndex((other) => other.sys.id === entry.sys.id) === i;
        });
    }
    return visited;
}

/**
 * Where an entry opened in Contentful's Live Preview should land: its own page for landing pages, products and
 * categories, otherwise the nearest page that links to it, falling back to the brand home. The brand is the one the
 * page (or, failing that, any entry on the way) was authored for, so the editor lands on the right site.
 */
export async function resolvePreviewTarget(args: Args, req: ContentRequest, entryId: string): Promise<PreviewTarget> {
    const brands = listBrands(getConfig(args.context).contentful?.brands);
    const visited =
        (await queryContentful(
            args,
            { space: req.space, cacheKey: `previewTarget:${entryId}`, preview: true },
            (client) => climbToPage(client, entryId)
        )) ?? [];

    const pages = visited.filter((entry) => PAGE_TYPES.has(contentTypeId(entry)));
    const brandOf = (entry: CfEntry) => brands.find((brand) => belongsToBrand(entry, brand));
    const page = pages.find((entry) => belongsToBrand(entry, req.brand)) ?? pages.find(brandOf) ?? pages[0];
    const brand = (page && brandOf(page)) ?? visited.map(brandOf).find((found): found is Brand => !!found) ?? req.brand;

    return { brand, path: page ? hrefForEntry(page, brand) : routes.home };
}
