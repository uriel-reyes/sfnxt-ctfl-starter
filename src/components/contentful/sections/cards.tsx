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
import type { ComponentType } from 'react';
import { cn } from '@/lib/utils';
import { ContentImage } from '@/components/contentful/content-image';
import { ContentLink } from '@/components/contentful/content-link';
import { AddToCartButton } from '@/components/mock-cart/add-to-cart-button';
import { useInspector } from '@/lib/contentful/inspector';
import { resolveMedia } from '@/lib/contentful/media';
import { isPackshot, productImages, productPrice, toCartProduct } from '@/lib/contentful/product';
import {
    contentTypeId,
    type BannerFields,
    type CallToActionFields,
    type CfEntry,
    type ProductCategoryFields,
    type ProductFields,
} from '@/lib/contentful/types';
import { RichText } from './rich-text';

const CARD_SIZES = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw';
const CARD_WIDTHS = [320, 480, 768, 1080] as const;

export function ProductCard({ product, priority = false }: { product: CfEntry<ProductFields>; priority?: boolean }) {
    const cf = useInspector();
    const f = product.fields;
    const image = productImages(product)[0];
    const price = productPrice(product);

    return (
        <div className="group flex h-full flex-col" data-testid="product-card">
            {/* The link covers image and copy only: the cart button can't nest inside it. */}
            <ContentLink entry={product} className="flex flex-1 flex-col">
                <div
                    className="relative aspect-square w-full overflow-hidden bg-muted"
                    {...cf(product.sys.id, 'media')}>
                    {image && (
                        <ContentImage
                            image={{ ...image, alt: image.alt || f.name || '' }}
                            sizes={CARD_SIZES}
                            widths={CARD_WIDTHS}
                            priority={priority}
                            className={cn(
                                'absolute inset-0 size-full transition-transform duration-500 group-hover:scale-[1.03]',
                                isPackshot(image) ? 'object-contain p-6 mix-blend-multiply' : 'object-cover'
                            )}
                        />
                    )}
                </div>
                <div className="mt-4 flex flex-1 flex-col">
                    {f.name && (
                        <h3 className="text-base font-extrabold leading-snug text-foreground group-hover:text-primary">
                            {f.name}
                        </h3>
                    )}
                    {f.teaser && <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{f.teaser}</p>}
                    {price && <p className="mt-auto pt-3 text-base font-extrabold text-foreground">{price}</p>}
                </div>
            </ContentLink>
            <div className="mt-3">
                <AddToCartButton product={toCartProduct(product)} />
            </div>
        </div>
    );
}

function ProductCategoryCard({ category }: { category: CfEntry<ProductCategoryFields> }) {
    const cf = useInspector();
    const f = category.fields;
    const media = resolveMedia(f.media);
    return (
        <ContentLink entry={category} className="group flex h-full flex-col">
            <div className="relative aspect-square w-full overflow-hidden bg-muted" {...cf(category.sys.id, 'media')}>
                {media && (
                    <ContentImage
                        image={{ ...media, alt: media.alt || f.title || '' }}
                        sizes={CARD_SIZES}
                        widths={CARD_WIDTHS}
                        className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                )}
            </div>
            {f.title && (
                <h3 className="mt-3 text-center text-base font-extrabold uppercase tracking-wide text-foreground group-hover:text-primary">
                    {f.title}
                </h3>
            )}
        </ContentLink>
    );
}

function BannerCard({ banner }: { banner: CfEntry<BannerFields> }) {
    const cf = useInspector();
    const f = banner.fields;
    const media = resolveMedia(f.media);
    const body = (
        <>
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted" {...cf(banner.sys.id, 'media')}>
                {media && (
                    <ContentImage
                        image={{ ...media, alt: media.alt || f.heading || '' }}
                        sizes={CARD_SIZES}
                        widths={CARD_WIDTHS}
                        className="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                )}
            </div>
            <div className="mt-3">
                {f.heading && (
                    <h3 className="text-lg font-extrabold leading-snug text-foreground group-hover:text-primary">
                        {f.heading}
                    </h3>
                )}
                {f.body && <RichText document={f.body} className="mt-1 text-sm text-muted-foreground" />}
            </div>
        </>
    );
    const link = f.links?.[0];
    return link ? (
        <ContentLink link={link} className="group flex h-full flex-col">
            {body}
        </ContentLink>
    ) : (
        <div className="group flex h-full flex-col">{body}</div>
    );
}

function CallToActionCard({ cta }: { cta: CfEntry<CallToActionFields> }) {
    const cf = useInspector();
    const f = cta.fields;
    const media = resolveMedia(f.media);
    const body = (
        <>
            {f.heading && (
                <h3 className="text-xl font-extrabold leading-snug text-foreground group-hover:text-primary">
                    {f.heading}
                </h3>
            )}
            {f.body && <RichText document={f.body} className="mt-2 text-sm text-muted-foreground" />}
            {f.label && (
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-extrabold uppercase tracking-wide text-primary">
                    {f.label}
                    <span aria-hidden>&rarr;</span>
                </span>
            )}
        </>
    );
    const content = media ? (
        <>
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted" {...cf(cta.sys.id, 'media')}>
                <ContentImage
                    image={{ ...media, alt: media.alt || f.heading || '' }}
                    sizes={CARD_SIZES}
                    widths={CARD_WIDTHS}
                    className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
            </div>
            <div className="mt-4 flex flex-1 flex-col items-start">{body}</div>
        </>
    ) : (
        <div className="flex h-full flex-col items-start bg-muted p-8">{body}</div>
    );

    if (f.urlTarget) {
        return (
            <ContentLink to={f.urlTarget} className="group flex h-full flex-col">
                {content}
            </ContentLink>
        );
    }
    if (f.internalTarget) {
        return (
            <ContentLink entry={f.internalTarget} className="group flex h-full flex-col">
                {content}
            </ContentLink>
        );
    }
    return <div className="group flex h-full flex-col">{content}</div>;
}

type AnyEntry = CfEntry;

/**
 * Content type → card. Collections render each item through this registry, so a new item type is one line here
 * plus a card component. Unknown types render nothing rather than breaking the page.
 */
const CARDS: Record<string, ComponentType<{ item: AnyEntry }>> = {
    banner: ({ item }) => <BannerCard banner={item as CfEntry<BannerFields>} />,
    callToAction: ({ item }) => <CallToActionCard cta={item as CfEntry<CallToActionFields>} />,
    product: ({ item }) => <ProductCard product={item as CfEntry<ProductFields>} />,
    productCategory: ({ item }) => <ProductCategoryCard category={item as CfEntry<ProductCategoryFields>} />,
};

export function CollectionCard({ item }: { item: AnyEntry }) {
    const Card = CARDS[contentTypeId(item)];
    return Card ? <Card item={item} /> : null;
}
