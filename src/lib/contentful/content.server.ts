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
import type { ExposedAudienceDefinition } from '@ninetailed/experience.js-preview-bridge';
import { AudienceMapper, ExperienceMapper, type ExperienceEntryLike } from '@ninetailed/experience.js-utils-contentful';
import { getConfig } from '@salesforce/storefront-next-runtime/config';
import { siteContext } from '@salesforce/storefront-next-runtime/site-context';
import { type Brand, belongsToBrand, brandFor, candidateSlugs, contentName, entryPrefix, listBrands } from './brand';
import { type ContentfulClient, queryContentful } from './client.server';
import { isContentfulPreview } from './preview.server';
import { breakCycles, normalizeExperienceIds, stripStega } from './live-preview';
import { dynamicCollectionTypes, mergeDynamicItems } from './blog';
import {
    contentTypeId,
    type BlogPostFields,
    type BrandTab,
    type CfEntry,
    type CompanyFields,
    type DynamicCollectionFields,
    type DynamicListingPageFields,
    type PersonalizationPreviewData,
    type LandingPageFields,
    type NavigationFields,
    type ProductCategoryFields,
    type ProductFields,
} from './types';

/**
 * Brand-scoped content reads. Every query runs against the shared `brand` space and keeps only entries authored
 * for the current brand (see `brand.ts` for why scoping is by internal name rather than tag). Results are plain,
 * cycle-free clones so they serialize through loaders and Ninetailed's preview channel.
 */

type Args = Pick<LoaderFunctionArgs, 'context' | 'request'>;

export type ContentRequest = { brand: Brand; preview: boolean; space: string };

/** Resolves the brand for the request's site and whether it is a validated preview request. */
export function contentRequest(args: Args): ContentRequest | null {
    const config = getConfig(args.context);
    const siteId = args.context.get(siteContext)?.site.id;
    const brand = siteId ? brandFor(config.contentful?.brands, siteId) : null;
    if (!brand) return null;
    return { brand, preview: isContentfulPreview(args.request), space: brand.space };
}

const MAX_INCLUDE = 10;

async function getEntries<T extends Record<string, unknown>>(
    client: ContentfulClient,
    query: Record<string, unknown>
): Promise<CfEntry<T>[]> {
    const res = await client.withoutUnresolvableLinks.getEntries(query as never);
    return breakCycles(res.items as unknown as CfEntry<T>[]);
}

function run<T>(args: Args, req: ContentRequest, cacheKey: string, load: (client: ContentfulClient) => Promise<T>) {
    return queryContentful(args, { space: req.space, cacheKey, preview: req.preview }, load);
}

const bySlugOrder = <T extends Record<string, unknown>>(items: CfEntry<T>[], slugs: string[]) =>
    slugs
        .map((slug) => items.find((item) => stripStega(item.fields.slug as string | undefined) === slug))
        .find(Boolean);

async function findBySlug<T extends Record<string, unknown>>(
    args: Args,
    req: ContentRequest,
    contentType: string,
    segment: string,
    include: number
): Promise<CfEntry<T> | null> {
    const slugs = candidateSlugs(segment, req.brand);
    const result = await run(args, req, `${contentType}:${req.brand.siteId}:${segment}`, async (client) => {
        const items = await getEntries<T>(client, {
            content_type: contentType,
            'fields.slug[in]': slugs.join(','),
            include,
            limit: 10,
        });
        return bySlugOrder(
            items.filter((item) => belongsToBrand(item, req.brand)),
            slugs
        );
    });
    return result ?? null;
}

/** The brand's home page (its configured `homeSlug`). */
export async function getHomePage(args: Args, req: ContentRequest): Promise<CfEntry<LandingPageFields> | null> {
    const result = await run(args, req, `landingPage:${req.brand.siteId}:__home`, async (client) => {
        const items = await getEntries<LandingPageFields>(client, {
            content_type: 'landingPage',
            'fields.slug': req.brand.homeSlug,
            include: MAX_INCLUDE,
            limit: 1,
        });
        return items[0] ?? null;
    });
    return result ?? null;
}

/** A brand landing page by URL segment (`shop` resolves `shop-rawlings`). */
export function getLandingPage(args: Args, req: ContentRequest, segment: string) {
    return findBySlug<LandingPageFields>(args, req, 'landingPage', segment, MAX_INCLUDE);
}

export function getProduct(args: Args, req: ContentRequest, segment: string) {
    return findBySlug<ProductFields>(args, req, 'product', segment, 4);
}

export function getCategory(args: Args, req: ContentRequest, segment: string) {
    return findBySlug<ProductCategoryFields>(args, req, 'productCategory', segment, 3);
}

/** The brand's products linking to a category. */
export async function getCategoryProducts(
    args: Args,
    req: ContentRequest,
    categoryId: string
): Promise<CfEntry<ProductFields>[]> {
    const result = await run(args, req, `categoryProducts:${req.brand.siteId}:${categoryId}`, async (client) => {
        const items = await getEntries<ProductFields>(client, {
            content_type: 'product',
            links_to_entry: categoryId,
            include: 2,
            limit: 100,
        });
        return items.filter((item) => belongsToBrand(item, req.brand));
    });
    return result ?? [];
}

/** Upper bound for brand-wide listings (blog index, dynamic collections). */
const MAX_LISTING = 100;

/** The brand's entries of one type, newest first (by creation date: the model has no publish-date field). */
async function getBrandEntries<T extends Record<string, unknown>>(
    args: Args,
    req: ContentRequest,
    contentType: string,
    include: number
): Promise<CfEntry<T>[]> {
    const result = await run(args, req, `latest:${contentType}:${req.brand.siteId}`, async (client) => {
        const items = await getEntries<T>(client, {
            content_type: contentType,
            'fields.internalName[match]': contentName(req.brand),
            order: '-sys.createdAt',
            include,
            limit: MAX_LISTING,
        });
        return items.filter((item) => belongsToBrand(item, req.brand));
    });
    return result ?? [];
}

/** A brand blog post by URL segment, with its authors, embedded entries, CTA and related posts. */
export function getBlogPost(args: Args, req: ContentRequest, segment: string) {
    return findBySlug<BlogPostFields>(args, req, 'blogPost', segment, 4);
}

/** The brand's blog posts, newest first. */
export function getBlogPosts(args: Args, req: ContentRequest): Promise<CfEntry<BlogPostFields>[]> {
    return getBrandEntries<BlogPostFields>(args, req, 'blogPost', 2);
}

/** The brand's `dynamicListingPage` for blog posts (any slug), which frames `/blog`. Optional. */
export async function getBlogListingPage(
    args: Args,
    req: ContentRequest
): Promise<CfEntry<DynamicListingPageFields> | null> {
    const result = await run(args, req, `blogListing:${req.brand.siteId}`, async (client) => {
        const items = await getEntries<DynamicListingPageFields>(client, {
            content_type: 'dynamicListingPage',
            'fields.listingType': 'blogPost',
            include: MAX_INCLUDE,
            limit: 20,
        });
        return items.find((item) => belongsToBrand(item, req.brand)) ?? null;
    });
    return result ?? null;
}

async function dynamicCollectionItems(
    args: Args,
    req: ContentRequest,
    collection: CfEntry<DynamicCollectionFields>
): Promise<CfEntry[]> {
    try {
        const queried = await Promise.all(
            dynamicCollectionTypes(collection).map((type) => getBrandEntries(args, req, type, 2))
        );
        return mergeDynamicItems(collection, queried.flat());
    } catch {
        // One failed listing shouldn't take the page down: show the pinned entries alone (the failure is logged).
        return mergeDynamicItems(collection, []);
    }
}

/**
 * Runs the queries of the `dynamicCollection` entries in a page's section field and fills their `items`, so they
 * render like collections. Returns a copy: the fetched page may be a shared cache entry.
 */
export async function resolveDynamicCollections<T extends Record<string, unknown>>(
    args: Args,
    req: ContentRequest,
    page: CfEntry<T>,
    field: keyof T & string
): Promise<CfEntry<T>> {
    const sections = page.fields[field] as CfEntry[] | undefined;
    if (!sections?.some((section) => contentTypeId(section) === 'dynamicCollection')) return page;
    const resolved = await Promise.all(
        sections.map(async (section) => {
            if (contentTypeId(section) !== 'dynamicCollection') return section;
            const collection = section as CfEntry<DynamicCollectionFields>;
            const items = await dynamicCollectionItems(args, req, collection);
            return { ...collection, fields: { ...collection.fields, items } };
        })
    );
    return { ...page, fields: { ...page.fields, [field]: resolved } };
}

const naturalOrder = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });

/** The brand's top-level navigation entries, ordered by internal name (`Rawlings - Navigation 1`, `… 2`). */
export async function getNavigation(args: Args, req: ContentRequest): Promise<CfEntry<NavigationFields>[]> {
    const result = await run(args, req, `navigation:${req.brand.siteId}`, async (client) => {
        const items = await getEntries<NavigationFields>(client, {
            content_type: 'navigation',
            'fields.internalName[match]': contentName(req.brand),
            include: 3,
            limit: 50,
        });
        return items
            .filter((item) => belongsToBrand(item, req.brand))
            .sort((a, b) =>
                naturalOrder.compare(stripStega(a.fields.internalName) ?? '', stripStega(b.fields.internalName) ?? '')
            );
    });
    return result ?? [];
}

/** One tab per configured brand, with the logo from its `company` entry (matched by name). */
export async function getBrandTabs(args: Args, req: ContentRequest): Promise<BrandTab[]> {
    const brands = listBrands(getConfig(args.context).contentful?.brands);
    const companies =
        (await run(args, req, 'companies', (client) =>
            getEntries<CompanyFields>(client, { content_type: 'company', include: 1, limit: 50 })
        )) ?? [];

    return brands.map((brand) => {
        const company = companies.find(
            (c) => stripStega(c.fields.name)?.trim().toLowerCase() === brand.name.toLowerCase()
        );
        const url = brand.logo ?? company?.fields.logo?.fields?.file?.url;
        return {
            siteId: brand.siteId,
            name: brand.name,
            logoUrl: url ? (url.startsWith('//') ? `https:${url}` : url) : undefined,
        };
    });
}

/** Experiences and audiences for the Ninetailed preview widget; experiences are narrowed to the brand's. */
export async function getPersonalizationPreviewData(
    args: Args,
    req: ContentRequest
): Promise<PersonalizationPreviewData | null> {
    return run(args, req, `personalizationPreview:${req.brand.siteId}`, async (client) => {
        const [experienceItems, audienceItems] = await Promise.all([
            getEntries(client, { content_type: 'nt_experience', include: MAX_INCLUDE, limit: 200 }),
            getEntries(client, { content_type: 'nt_audience', limit: 200 }),
        ]);

        const prefix = entryPrefix(req.brand).toLowerCase();
        const mapped = (experienceItems as unknown as ExperienceEntryLike[])
            .filter((entry) => ExperienceMapper.isExperienceEntry(entry))
            .map((entry) => ExperienceMapper.mapExperience(entry))
            .map(normalizeExperienceIds);
        const forBrand = mapped.filter((exp) => stripStega(exp.name)?.toLowerCase().includes(prefix));

        const audiences = audienceItems
            .filter((entry) => AudienceMapper.isAudienceEntry(entry as never))
            .map((entry) => {
                const audience = AudienceMapper.mapAudience(entry as never);
                return {
                    id: stripStega(audience.id),
                    name: stripStega(audience.name) ?? stripStega(audience.id),
                    description: stripStega(audience.description),
                } satisfies ExposedAudienceDefinition;
            });

        return { experiences: breakCycles(forBrand.length ? forBrand : mapped), audiences };
    });
}
