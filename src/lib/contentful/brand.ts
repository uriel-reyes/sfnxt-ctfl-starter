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
import { useMemo } from 'react';
import { useConfig } from '@salesforce/storefront-next-runtime/config';
import { useSite } from '@salesforce/storefront-next-runtime/site-context';
import type { ContentfulBrandConfig } from '@/types/config';
import { stripStega } from './live-preview';
import type { CfEntry } from './types';

/**
 * A brand is a storefront site whose content lives in a shared Contentful space. Its entries are authored with a
 * Contentful tag (e.g. `rawlings`), but the brand tags are private, and the Delivery/Preview APIs never return
 * private tags, so delivery scoping uses the authoring convention both brands follow: every entry's internal name
 * starts with `<Brand name> - ` (e.g. "Rawlings - Hero"), and brand-specific slugs may end in `-<tag>`
 * (e.g. `shop-rawlings`), which URLs drop.
 */
export type Brand = ContentfulBrandConfig & { siteId: string };

export function listBrands(brands: Record<string, ContentfulBrandConfig> | undefined): Brand[] {
    return Object.entries(brands ?? {}).map(([siteId, brand]) => ({ ...brand, siteId }));
}

export function brandFor(brands: Record<string, ContentfulBrandConfig> | undefined, siteId: string): Brand | null {
    const brand = brands?.[siteId];
    return brand ? { ...brand, siteId } : null;
}

/** Name the brand's entries are authored under (`contentName`, else the display name). */
export const contentName = (brand: Brand) => brand.contentName ?? brand.name;

/** Prefix every brand entry's internal name starts with, e.g. `Rawlings - `. */
export const entryPrefix = (brand: Brand) => `${contentName(brand)} - `;

/** Slug suffix brand-specific slugs carry, e.g. `-rawlings`. */
export const slugSuffix = (brand: Brand) => `-${brand.tag}`;

/** True when the entry was authored for the brand (by internal-name prefix). */
export function belongsToBrand(entry: CfEntry | undefined, brand: Brand): boolean {
    const internalName = stripStega(entry?.fields?.internalName as string | undefined) ?? '';
    return internalName.toLowerCase().startsWith(entryPrefix(brand).toLowerCase());
}

/** The URL segment for a slug: the brand suffix is dropped (`shop-rawlings` → `shop`). */
export function urlSlug(slug: string, brand: Brand | null): string {
    const clean = stripStega(slug);
    if (!brand) return clean;
    const suffix = slugSuffix(brand);
    return clean.endsWith(suffix) && clean.length > suffix.length ? clean.slice(0, -suffix.length) : clean;
}

/** Slugs to try, most specific first, when resolving a URL segment back to an entry. */
export function candidateSlugs(segment: string, brand: Brand): string[] {
    return [`${segment}${slugSuffix(brand)}`, segment];
}

/** The brand for the current site. */
export function useBrand(): Brand | null {
    const config = useConfig();
    const { site } = useSite();
    return useMemo(() => brandFor(config.contentful?.brands, site.id), [config.contentful?.brands, site.id]);
}

/** Every configured brand, in config order. */
export function useBrands(): Brand[] {
    const config = useConfig();
    return useMemo(() => listBrands(config.contentful?.brands), [config.contentful?.brands]);
}
