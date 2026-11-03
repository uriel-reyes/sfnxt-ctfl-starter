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
import { stripStega } from './live-preview';
import { assetUrl, type ResolvedImage, resolveMedia } from './media';
import type { CfEntry, ProductFields } from './types';

export type ProductImage = ResolvedImage;

/** The product's images in display order: the `media` entry first (focal point, alt text), then unseen `images`. */
export function productImages(product: CfEntry<ProductFields>): ProductImage[] {
    const f = product.fields;
    const images: ProductImage[] = [];
    const primary = resolveMedia(f.media);
    if (primary) images.push(primary);

    for (const asset of f.images ?? []) {
        const url = assetUrl(asset);
        if (!url || images.some((img) => img.url === url)) continue;
        const details = asset?.fields?.file?.details?.image;
        images.push({
            url,
            alt: asset?.fields?.description || asset?.fields?.title || f.name || '',
            width: details?.width,
            height: details?.height,
        });
    }
    return images;
}

/** Square images are cut-out packshots (shown whole on a muted tile); anything else fills the frame. */
export function isPackshot(img: ProductImage): boolean {
    const ratio = img.width && img.height ? img.width / img.height : 1;
    return Math.abs(ratio - 1) < 0.1;
}

const DEFAULT_CURRENCY = 'USD';

export function formatMoney(amount: number, currency = DEFAULT_CURRENCY): string {
    try {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
    } catch {
        return amount.toFixed(2);
    }
}

/** Numeric price from the linked `sku`, or null when the product has none (the Rawlings/Easton products don't). */
export function productPriceAmount(product: CfEntry<ProductFields>): number | null {
    const raw = stripStega(product.fields.sku?.fields?.price);
    const amount = Number(raw);
    return raw && !Number.isNaN(amount) ? amount : null;
}

function productCurrency(product: CfEntry<ProductFields>): string {
    return stripStega(product.fields.sku?.fields?.currencyCode) || DEFAULT_CURRENCY;
}

export function productPrice(product: CfEntry<ProductFields>): string | null {
    const amount = productPriceAmount(product);
    return amount === null ? null : formatMoney(amount, productCurrency(product));
}

/** Plain, serializable product snapshot the mock cart stores as-is, so the cart renders without Contentful. */
export type CartProduct = {
    id: string;
    slug: string;
    name: string;
    image?: ProductImage;
    /** Null for products without a linked price; the cart then omits money totals for them. */
    price: number | null;
    currency: string;
    categorySlug?: string;
    categoryTitle?: string;
};

export function toCartProduct(product: CfEntry<ProductFields>): CartProduct {
    const f = product.fields;
    const category = f.categories?.[0]?.fields;
    const image = productImages(product)[0];
    return {
        id: product.sys.id,
        slug: stripStega(f.slug) || '',
        name: stripStega(f.name) || '',
        image: image ? { ...image, alt: stripStega(image.alt) } : undefined,
        price: productPriceAmount(product),
        currency: productCurrency(product),
        categorySlug: stripStega(category?.slug),
        categoryTitle: stripStega(category?.title),
    };
}
