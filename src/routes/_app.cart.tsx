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
import { useEffect, useRef, useState } from 'react';
import { useSite } from '@salesforce/storefront-next-runtime/site-context';
import { Button, buttonVariants } from '@/components/ui/button';
import { ContentLink } from '@/components/contentful/content-link';
import { CartLineItem } from '@/components/mock-cart/cart-line-item';
import { SeoMeta } from '@/components/seo-meta';
import { useBrand } from '@/lib/contentful/brand';
import { formatMoney } from '@/lib/contentful/product';
import { clearCart, getCart, useCart } from '@/lib/mock-cart/store';
import { useCommerceTracking } from '@/lib/personalization/use-commerce-tracking';
import { routes } from '@/route-paths';

/**
 * The brand's mock cart and a demo checkout. Nothing is sent to a commerce backend: placing the order only reports
 * it to personalization and empties the browser cart.
 */
export default function CartPage() {
    const { site } = useSite();
    const brand = useBrand();
    const cart = useCart(site.id);
    const tracking = useCommerceTracking();
    const [orderId, setOrderId] = useState<string | null>(null);

    // The server renders an empty cart; report the view once the browser cart is read.
    const viewed = useRef(false);
    useEffect(() => {
        if (viewed.current || cart.count === 0) return;
        viewed.current = true;
        tracking.cartViewed(cart);
    }, [cart, tracking]);

    const placeOrder = () => {
        const order = getCart(site.id);
        tracking.checkoutStarted(order);
        const id = `DEMO-${Date.now().toString(36).toUpperCase()}`;
        tracking.orderCompleted(id, order, clearCart(site.id));
        setOrderId(id);
    };

    return (
        <div className="section-container py-10 md:py-14">
            <SeoMeta title="Cart" siteName={brand?.name} noIndex />
            <h1 className="text-3xl font-extrabold md:text-4xl">Your cart</h1>

            {orderId ? (
                <div className="mt-8 max-w-xl rounded-ui border border-border p-8" role="status">
                    <h2 className="text-xl font-bold">Thanks for your order</h2>
                    <p className="mt-2 text-muted-foreground">
                        Demo order <span className="font-mono text-foreground">{orderId}</span> was placed. No payment
                        was taken and nothing was shipped.
                    </p>
                    <ContentLink to={routes.home} className={buttonVariants({ className: 'mt-6' })}>
                        Continue shopping
                    </ContentLink>
                </div>
            ) : cart.lines.length === 0 ? (
                <div className="mt-8">
                    <p className="text-muted-foreground">Your cart is empty.</p>
                    <ContentLink to={routes.shop} className={buttonVariants({ className: 'mt-6' })}>
                        Shop now
                    </ContentLink>
                </div>
            ) : (
                <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-3">
                    <ul className="divide-y divide-border border-y border-border lg:col-span-2">
                        {cart.lines.map((line) => (
                            <CartLineItem key={line.id} line={line} />
                        ))}
                    </ul>
                    <aside className="h-fit rounded-ui border border-border p-6" aria-label="Order summary">
                        <h2 className="text-lg font-bold">Order summary</h2>
                        <dl className="mt-4 space-y-2 text-sm">
                            <div className="flex justify-between">
                                <dt>Items</dt>
                                <dd>{cart.count}</dd>
                            </div>
                            {cart.subtotal !== null && (
                                <div className="flex justify-between font-semibold">
                                    <dt>Subtotal</dt>
                                    <dd>{formatMoney(cart.subtotal, cart.currency)}</dd>
                                </div>
                            )}
                        </dl>
                        <p className="mt-4 text-xs text-muted-foreground">
                            Demo checkout: placing the order sends an order event to personalization and empties the
                            cart.
                        </p>
                        <Button className="mt-6 w-full" onClick={placeOrder} data-testid="place-demo-order">
                            Place demo order
                        </Button>
                    </aside>
                </div>
            )}
        </div>
    );
}
