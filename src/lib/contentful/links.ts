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
import { routes } from '@/route-paths';
import { type Brand, urlSlug } from './brand';
import { stripStega } from './live-preview';
import { contentTypeId, type CfEntry, type LinkFields } from './types';

/**
 * Content type → URL prefix for routed entries. Paths are site-relative: render them with the project `Link`,
 * which adds the `/:siteId/:localeId` prefix.
 */
export const ROUTE_PREFIXES: Record<string, string> = {
    product: routes.products,
    productCategory: routes.shop,
    blogPost: routes.blog,
};

/** Site-relative href for a resolved internal-target entry. */
export function hrefForEntry(entry: CfEntry | undefined, brand: Brand | null): string {
    if (!entry) return routes.home;
    const type = contentTypeId(entry);
    const slug = stripStega((entry.fields?.slug as string | undefined) ?? '');

    if (type === 'landingPage') {
        if (!slug || slug === brand?.homeSlug) return routes.home;
        return `/${urlSlug(slug, brand)}`;
    }
    // The blog listing page frames `/blog` whatever its slug. Listings of other types have no route yet.
    if (type === 'dynamicListingPage' && stripStega(entry.fields?.listingType as string | undefined) === 'blogPost') {
        return routes.blog;
    }
    const prefix = ROUTE_PREFIXES[type];
    if (prefix) return slug ? `${prefix}/${urlSlug(slug, brand)}` : prefix;
    return slug ? `/${urlSlug(slug, brand)}` : routes.home;
}

export type ResolvedLink = { href: string; external: boolean };

const isExternal = (href: string) => /^(https?:)?\/\//i.test(href) || href.startsWith('mailto:');

/** Resolves a `link` entry, or an explicit URL, to an href and whether it leaves the storefront. */
export function resolveHref(target: { url?: string; entry?: CfEntry } | undefined, brand: Brand | null): ResolvedLink {
    const url = stripStega(target?.url);
    if (url) return { href: url, external: isExternal(url) };
    return { href: hrefForEntry(target?.entry, brand), external: false };
}

export function resolveLink(link: CfEntry<LinkFields> | undefined, brand: Brand | null): ResolvedLink {
    return resolveHref({ url: link?.fields?.externalTarget, entry: link?.fields?.internalTarget }, brand);
}

export function labelForLink(link: CfEntry<LinkFields> | undefined): string {
    return link?.fields?.label || link?.fields?.internalName || '';
}
