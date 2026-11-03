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
import { SeoMeta } from '@/components/seo-meta';
import { useBrand } from '@/lib/contentful/brand';
import { usePreviewMode } from '@/lib/contentful/inspector';
import { stripStega } from '@/lib/contentful/live-preview';
import { assetUrl } from '@/lib/contentful/media';
import type { CfAsset, CfEntry, SeoFields } from '@/lib/contentful/types';

/**
 * Page `<title>`, description and Open Graph tags from a Contentful `seo` entry, falling back to the given title,
 * description and image. Values are stripped of Live Preview encoding; previews are never indexed.
 */
export function ContentSeo({
    seo,
    title,
    description,
    image,
    url,
    type = 'website',
}: {
    seo?: CfEntry<SeoFields>;
    title?: string;
    description?: string;
    image?: CfAsset | string;
    url: string;
    type?: 'website' | 'product' | 'article';
}) {
    const brand = useBrand();
    const preview = usePreviewMode();
    const f = seo?.fields;
    const robots = (f?.robots ?? []).map((value) => stripStega(value).toLowerCase());
    const imageSrc = assetUrl(f?.image) ?? (typeof image === 'string' ? image : assetUrl(image));

    return (
        <SeoMeta
            title={stripStega(f?.title || title)}
            // Authored SEO titles are complete (they carry the brand); fallback titles get the brand suffix.
            rawTitle={Boolean(f?.title)}
            siteName={brand?.name}
            description={stripStega(f?.description || description)}
            noIndex={preview || robots.some((value) => value.includes('noindex'))}
            openGraph={{ type, url, image: imageSrc }}
        />
    );
}
