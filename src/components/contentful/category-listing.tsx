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
import { useEffect } from 'react';
import { ContentLink } from '@/components/contentful/content-link';
import { ContentSeo } from '@/components/contentful/content-seo';
import { ProductCard } from '@/components/contentful/sections/cards';
import { stripStega } from '@/lib/contentful/live-preview';
import type { CfEntry, ProductCategoryFields, ProductFields } from '@/lib/contentful/types';
import { useCommerceTracking } from '@/lib/personalization/use-commerce-tracking';
import { routes } from '@/route-paths';
import { useLiveEntry } from '@/components/contentful/live-preview/use-live-entry';

/** Above-the-fold product tiles load eagerly; the rest are lazy. */
const EAGER_TILES = 4;

export function CategoryListing({
    category: loaded,
    products,
    url,
}: {
    category: CfEntry<ProductCategoryFields>;
    products: CfEntry<ProductFields>[];
    url: string;
}) {
    const category = useLiveEntry(loaded);
    const f = category.fields;
    const tracking = useCommerceTracking();
    const slug = stripStega(category.fields.slug);

    useEffect(() => {
        if (slug) tracking.categoryViewed(slug);
    }, [slug, tracking]);

    return (
        <div className="section-container py-10 md:py-14">
            <ContentSeo seo={f.seoMetadata} title={f.title} description={f.description} url={url} />
            <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
                <ol className="flex flex-wrap items-center gap-2">
                    <li>
                        <ContentLink to={routes.home} className="hover:text-foreground">
                            Home
                        </ContentLink>
                    </li>
                    <li aria-hidden>/</li>
                    <li>
                        <ContentLink to={routes.shop} className="hover:text-foreground">
                            Shop
                        </ContentLink>
                    </li>
                    <li aria-hidden>/</li>
                    <li aria-current="page" className="text-foreground">
                        {f.title}
                    </li>
                </ol>
            </nav>
            <header className="mt-6 max-w-3xl">
                <h1 className="text-3xl font-extrabold md:text-5xl">{f.title}</h1>
                {f.description && <p className="mt-3 text-muted-foreground md:text-lg">{f.description}</p>}
            </header>
            {(f.subcategories?.length ?? 0) > 0 && (
                <div className="mt-6 flex flex-wrap gap-2">
                    {f.subcategories?.map((sub) => (
                        <ContentLink
                            key={sub.sys.id}
                            entry={sub}
                            className="rounded-full border border-border px-4 py-1.5 text-sm hover:border-primary hover:text-primary">
                            {sub.fields.title}
                        </ContentLink>
                    ))}
                </div>
            )}
            <p className="mt-8 text-sm text-muted-foreground" aria-live="polite">
                {products.length} {products.length === 1 ? 'product' : 'products'}
            </p>
            {products.length > 0 ? (
                <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {products.map((product, index) => (
                        <ProductCard key={product.sys.id} product={product} priority={index < EAGER_TILES} />
                    ))}
                </div>
            ) : (
                <p className="mt-10 text-muted-foreground">No products in this category yet.</p>
            )}
        </div>
    );
}
