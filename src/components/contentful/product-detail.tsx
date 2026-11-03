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
import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { ContentImage } from '@/components/contentful/content-image';
import { ContentLink } from '@/components/contentful/content-link';
import { ContentSeo } from '@/components/contentful/content-seo';
import { RichText } from '@/components/contentful/sections/rich-text';
import { plainText } from '@/lib/contentful/rich-text';
import { Sections } from '@/components/contentful/sections/section-renderer';
import { AddToCartButton } from '@/components/mock-cart/add-to-cart-button';
import { QuantityStepper } from '@/components/mock-cart/quantity-stepper';
import { useInspector } from '@/lib/contentful/inspector';
import { stripStega } from '@/lib/contentful/live-preview';
import { isPackshot, productImages, productPrice, toCartProduct } from '@/lib/contentful/product';
import type { CfEntry, ProductFields } from '@/lib/contentful/types';
import { useCommerceTracking } from '@/lib/personalization/use-commerce-tracking';
import { routes } from '@/route-paths';
import { useLiveEntry } from '@/components/contentful/live-preview/use-live-entry';

function Gallery({ product }: { product: CfEntry<ProductFields> }) {
    const cf = useInspector();
    const images = productImages(product);
    const [active, setActive] = useState(0);
    const current = images[Math.min(active, images.length - 1)];
    const name = product.fields.name ?? '';

    if (!current) return <div className="aspect-square w-full bg-muted" />;
    return (
        <div className="flex flex-col gap-4">
            <div className="relative aspect-square w-full overflow-hidden bg-muted" {...cf(product.sys.id, 'media')}>
                <ContentImage
                    image={{ ...current, alt: current.alt || name }}
                    priority
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    widths={[480, 768, 1080, 1440]}
                    className={cn(
                        'absolute inset-0 size-full',
                        isPackshot(current) ? 'object-contain p-8 mix-blend-multiply' : 'object-cover'
                    )}
                />
            </div>
            {images.length > 1 && (
                <div className="grid grid-cols-5 gap-3" role="group" aria-label="Product images">
                    {images.map((image, index) => (
                        <button
                            key={image.url}
                            type="button"
                            onClick={() => setActive(index)}
                            aria-label={`Show image ${index + 1} of ${images.length}`}
                            aria-pressed={index === active}
                            className={cn(
                                'relative aspect-square overflow-hidden bg-muted border-2 transition-colors',
                                index === active ? 'border-primary' : 'border-transparent hover:border-border'
                            )}>
                            <ContentImage
                                image={{ ...image, alt: '' }}
                                sizes="20vw"
                                widths={[160, 320]}
                                className="absolute inset-0 size-full object-cover"
                            />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export function ProductDetail({ product: loaded, url }: { product: CfEntry<ProductFields>; url: string }) {
    const product = useLiveEntry(loaded);
    const f = product.fields;
    const price = productPrice(product);
    const cartProduct = useMemo(() => toCartProduct(product), [product]);
    const category = f.categories?.[0];
    const [quantity, setQuantity] = useState(1);
    const tracking = useCommerceTracking();

    useEffect(() => {
        tracking.productViewed(cartProduct);
    }, [cartProduct, tracking]);

    const firstImage = productImages(product)[0]?.url;

    return (
        <div className="section-container py-10 md:py-14">
            <ContentSeo
                seo={f.seoMetadata}
                title={f.name}
                description={f.teaser || stripStega(plainText(f.description)).slice(0, 160)}
                image={firstImage}
                url={url}
                type="product"
            />
            <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
                <ol className="flex flex-wrap items-center gap-2">
                    <li>
                        <ContentLink to={routes.shop} className="hover:text-foreground">
                            Shop
                        </ContentLink>
                    </li>
                    {category && (
                        <>
                            <li aria-hidden>/</li>
                            <li>
                                <ContentLink entry={category} className="hover:text-foreground">
                                    {category.fields.title}
                                </ContentLink>
                            </li>
                        </>
                    )}
                    <li aria-hidden>/</li>
                    <li aria-current="page" className="text-foreground">
                        {f.name}
                    </li>
                </ol>
            </nav>
            <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
                <Gallery product={product} />
                <div className="flex flex-col">
                    <h1 className="text-3xl font-extrabold leading-tight md:text-4xl">{f.name}</h1>
                    {price && <p className="mt-3 text-2xl font-bold">{price}</p>}
                    {f.teaser && <p className="mt-4 text-lg text-muted-foreground">{f.teaser}</p>}
                    <div className="mt-8 flex flex-wrap items-center gap-4">
                        <QuantityStepper value={quantity} onChange={setQuantity} label="Quantity" />
                        <AddToCartButton
                            product={cartProduct}
                            quantity={quantity}
                            className="w-auto flex-1 min-w-48 h-10"
                        />
                    </div>
                    {f.description && (
                        <div className="mt-10 border-t border-border pt-8">
                            <h2 className="mb-4 text-lg font-bold">Details</h2>
                            <RichText document={f.description} className="text-muted-foreground" />
                        </div>
                    )}
                </div>
            </div>
            {/* Sections come from the loader, not the live product: each one applies its own live edits. */}
            {(loaded.fields.additionalSections?.length ?? 0) > 0 && (
                <div className="mt-16">
                    <Sections sections={loaded.fields.additionalSections} owner={loaded} fieldId="additionalSections" />
                </div>
            )}
        </div>
    );
}
