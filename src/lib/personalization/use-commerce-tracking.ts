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
import { useNinetailed } from '@ninetailed/experience.js-react';
import { useBrand } from '@/lib/contentful/brand';
import type { CartProduct } from '@/lib/contentful/product';
import type { CartLine, CartSummary } from '@/lib/mock-cart/store';
import { DEMO_EMAIL, useMockSignedIn } from './mock-auth';

/**
 * The single place shopping behaviour reaches Ninetailed, so audiences in Contentful can target it:
 *
 * - Events (`track`): audience rules match on the event name, so category-scoped names (`product_added_gloves`)
 *   are sent next to the generic ones. Every event carries the `brand` it happened on.
 * - Traits (`identify`): cart state is mirrored onto the profile after every change (`cart_item_count`,
 *   `cart_has_<category>`), plus `last_brand` so cross-brand audiences can target the brand last browsed.
 *
 * Anonymous visitors are identified with an empty uid; the mock signed-in shopper keeps their demo email.
 */

type Traits = Record<string, string | number | boolean>;

const CATEGORIES_SEEN_KEY = 'storefront:cartCategoriesSeen';
const PURCHASE_COUNT_KEY = 'storefront:purchaseCount';

/** `bats-easton` → `bats_easton`, safe inside event and trait names. */
export function signalKey(slug: string): string {
    return slug
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '');
}

function readJson<T>(key: string, fallback: T): T {
    try {
        const raw = window.localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
        return fallback;
    }
}

function writeJson(key: string, value: unknown): void {
    try {
        window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
        // Ignore storage errors.
    }
}

/** `cart_has_<key>` for every key ever in the cart, so a removed item flips its trait back to false. */
function presenceTraits(values: (string | undefined)[]): Record<string, boolean> {
    const inCart = new Set(values.filter((v): v is string => Boolean(v)).map(signalKey));
    const seen = new Set([...readJson<string[]>(CATEGORIES_SEEN_KEY, []), ...inCart]);
    writeJson(CATEGORIES_SEEN_KEY, [...seen]);
    const traits: Record<string, boolean> = {};
    for (const key of seen) traits[`cart_has_${key}`] = inCart.has(key);
    return traits;
}

function cartTraits(cart: CartSummary): Traits {
    return {
        cart_item_count: cart.count,
        ...(cart.subtotal !== null ? { cart_value: cart.subtotal, cart_currency: cart.currency } : {}),
        ...presenceTraits(cart.lines.map((line) => line.categorySlug)),
    };
}

function productProperties(product: CartProduct, brand: string) {
    return {
        brand,
        product_id: product.id,
        slug: product.slug,
        name: product.name,
        category: product.categorySlug ?? '',
        ...(product.price !== null ? { price: product.price, currency: product.currency } : {}),
    };
}

export function useCommerceTracking() {
    const { track, identify } = useNinetailed();
    const signedIn = useMockSignedIn();
    const brand = useBrand()?.siteId ?? '';

    return useMemo(() => {
        const uid = signedIn ? DEMO_EMAIL : '';
        // Personalization must never break shopping: swallow SDK errors instead of surfacing them to the UI.
        const send = (promise: Promise<unknown>) => void promise.catch(() => undefined);
        const event = (name: string, properties: Record<string, string | number>) => send(track(name, properties));
        const traits = (values: Traits) => send(identify(uid, values));

        return {
            /** Sends a Contentful-authored link event (`link.eventName` + `eventPayload`). */
            linkClicked(name: string, payload?: Record<string, unknown>) {
                const properties: Record<string, string | number> = { brand };
                for (const [key, value] of Object.entries(payload ?? {})) {
                    if (typeof value === 'string' || typeof value === 'number') properties[key] = value;
                }
                event(name, properties);
            },

            productViewed(product: CartProduct) {
                event('product_viewed', productProperties(product, brand));
                if (product.categorySlug) {
                    event(`product_viewed_${signalKey(product.categorySlug)}`, productProperties(product, brand));
                }
                traits({
                    last_brand: brand,
                    last_viewed_product: product.slug,
                    ...(product.categorySlug ? { last_viewed_category: product.categorySlug } : {}),
                });
            },

            categoryViewed(categorySlug: string) {
                event(`category_viewed_${signalKey(categorySlug)}`, { brand, category: categorySlug });
                traits({ last_brand: brand, last_viewed_category: categorySlug });
            },

            productAdded(product: CartProduct, quantity: number, cart: CartSummary) {
                const properties = { ...productProperties(product, brand), quantity };
                event('product_added', properties);
                if (product.categorySlug) event(`product_added_${signalKey(product.categorySlug)}`, properties);
                traits({
                    ...cartTraits(cart),
                    last_added_product: product.slug,
                    ...(product.categorySlug ? { last_added_category: product.categorySlug } : {}),
                });
            },

            productRemoved(line: CartLine, cart: CartSummary) {
                event('product_removed', {
                    brand,
                    product_id: line.id,
                    slug: line.slug,
                    category: line.categorySlug ?? '',
                });
                traits(cartTraits(cart));
            },

            cartUpdated(cart: CartSummary) {
                traits(cartTraits(cart));
            },

            cartViewed(cart: CartSummary) {
                event('cart_viewed', { brand, item_count: cart.count });
            },

            checkoutStarted(cart: CartSummary) {
                event('checkout_started', { brand, item_count: cart.count });
            },

            /** Call with the cart as it was at checkout, then with the emptied cart. */
            orderCompleted(orderId: string, order: CartSummary, emptied: CartSummary) {
                event('order_completed', {
                    brand,
                    order_id: orderId,
                    item_count: order.count,
                    ...(order.subtotal !== null ? { order_value: order.subtotal } : {}),
                });
                const purchaseCount = readJson<number>(PURCHASE_COUNT_KEY, 0) + 1;
                writeJson(PURCHASE_COUNT_KEY, purchaseCount);
                const purchased: Traits = { [`purchased_${signalKey(brand)}`]: true };
                for (const line of order.lines) {
                    if (line.categorySlug) purchased[`purchased_${signalKey(line.categorySlug)}`] = true;
                }
                traits({ ...cartTraits(emptied), ...purchased, has_purchased: true, purchase_count: purchaseCount });
            },
        };
    }, [track, identify, signedIn, brand]);
}
