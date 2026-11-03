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
import type { Document } from '@contentful/rich-text-types';
import type { ExperienceConfiguration } from '@ninetailed/experience.js';
import type { ExposedAudienceDefinition } from '@ninetailed/experience.js-preview-bridge';

/**
 * Render-focused field typings for the Contentful content model. Links fetched with a deep `include` arrive as
 * nested entries/assets, so loaders cast SDK results to these resolved shapes instead of the SDK's link generics.
 */

export type CfEntry<T extends Record<string, unknown> = Record<string, unknown>> = {
    sys: {
        id: string;
        contentType: { sys: { id: string } };
    };
    fields: T;
};

export type CfAssetShape = {
    sys: { id: string };
    fields: {
        title?: string;
        description?: string;
        file?: {
            url?: string;
            fileName?: string;
            contentType?: string;
            details?: { size?: number; image?: { width: number; height: number } };
        };
    };
};

export type CfAsset = CfAssetShape | undefined;

export type ImageWithFocalPointFields = {
    internalName?: string;
    image?: CfAsset;
    /** Set by the Contentful Focal Point app: pixel coordinates on the original asset. */
    focalPoint?: { focalPoint?: { x: number; y: number } };
    altText?: string;
};

export type ExternalImageFields = {
    internalName?: string;
    image?: { url?: string; alt?: string; [k: string]: unknown };
};

export type MediaEntry = CfEntry<ImageWithFocalPointFields | ExternalImageFields>;

export type LinkFields = {
    internalName?: string;
    label?: string;
    description?: string;
    externalTarget?: string;
    internalTarget?: CfEntry;
    /** Optional personalization event sent when the link is clicked. */
    eventName?: string;
    eventPayload?: Record<string, unknown>;
};

/** Experiences attached by the Contentful Personalization app; can swap the entry for a variant. */
export type NtExperiences = CfEntry[];

export type CallToActionFields = {
    internalName?: string;
    heading?: string;
    body?: Document;
    media?: MediaEntry;
    label?: string;
    internalTarget?: CfEntry;
    urlTarget?: string;
    nt_experiences?: NtExperiences;
};

export type BannerFields = {
    internalName?: string;
    heading?: string;
    body?: Document;
    links?: CfEntry<LinkFields>[];
    media?: MediaEntry;
    contentPosition?: string;
    mediaPosition?: 'Background' | 'Left Half' | 'Right Half';
    theme?: 'Default' | 'Primary' | 'Secondary';
    size?: 'Large' | 'Medium' | 'Small' | 'Full Height';
    nt_experiences?: NtExperiences;
};

export type CollectionFields = {
    internalName?: string;
    heading?: string;
    introduction?: Document;
    items?: CfEntry[];
    links?: CfEntry<LinkFields>[];
    theme?: 'Default' | 'Primary' | 'Secondary';
    layout?: 'Grid' | 'Stack' | 'Accordion' | 'Carousel (Full)' | 'Carousel (Multi)' | 'Icon Grid';
    nt_experiences?: NtExperiences;
};

export type SeoFields = {
    internalName?: string;
    title?: string;
    description?: string;
    keywords?: string[];
    image?: CfAsset;
    imageAlt?: string;
    robots?: string[];
};

export type ProductCategoryFields = {
    internalName?: string;
    title?: string;
    slug?: string;
    media?: MediaEntry;
    description?: string;
    subcategories?: CfEntry<ProductCategoryFields>[];
    seoMetadata?: CfEntry<SeoFields>;
};

/** Commerce record a `product` links to via `sku`; carries price and stock. */
export type StockroomProductFields = {
    title?: string;
    slug?: string;
    externalId?: string;
    images?: string[];
    price?: string;
    currencyCode?: string;
    totalInventory?: number;
};

export type ProductFields = {
    internalName?: string;
    name?: string;
    slug?: string;
    sku?: CfEntry<StockroomProductFields>;
    teaser?: string;
    media?: MediaEntry;
    description?: Document;
    images?: CfAsset[];
    categories?: CfEntry<ProductCategoryFields>[];
    additionalSections?: CfEntry[];
    seoMetadata?: CfEntry<SeoFields>;
};

export type LandingPageFields = {
    internalName?: string;
    title?: string;
    teaser?: string;
    slug?: string;
    media?: MediaEntry;
    hero?: CfEntry;
    sections?: CfEntry[];
    seoMetadata?: CfEntry<SeoFields>;
};

export type NavigationFields = {
    internalName?: string;
    label?: string;
    display?: string;
    target?: CfEntry;
    children?: CfEntry<NavigationFields>[];
};

export type CompanyFields = {
    name?: string;
    logo?: CfAsset;
    logoAlt?: CfAsset;
};

/** Every experience and audience, mapped for the Ninetailed preview widget. */
export type PersonalizationPreviewData = {
    experiences: ExperienceConfiguration[];
    audiences: ExposedAudienceDefinition[];
};

/** A brand tab in the header: the brand site and the logo from its `company` entry. */
export type BrandTab = {
    siteId: string;
    name: string;
    logoUrl?: string;
};

/** The content type ID of a resolved entry, or '' for unresolved links. */
export function contentTypeId(entry: CfEntry | undefined | null): string {
    return entry?.sys?.contentType?.sys?.id ?? '';
}

/**
 * React keys for the entries of a reference field. A field may link the same entry more than once, and duplicate
 * keys make React drop and misorder items when Live Preview reorders the list, so repeats get an occurrence suffix.
 */
export function entryKeys(entries: readonly ({ sys: { id: string } } | null | undefined)[]): string[] {
    const seen = new Map<string, number>();
    return entries.map((entry, index) => {
        const id = entry?.sys?.id ?? `unresolved-${index}`;
        const count = seen.get(id) ?? 0;
        seen.set(id, count + 1);
        return count ? `${id}:${count}` : id;
    });
}
