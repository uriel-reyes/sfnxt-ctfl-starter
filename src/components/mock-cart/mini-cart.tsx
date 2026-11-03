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
import { useSite } from '@salesforce/storefront-next-runtime/site-context';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { buttonVariants } from '@/components/ui/button';
import { ContentLink } from '@/components/contentful/content-link';
import { formatMoney } from '@/lib/contentful/product';
import { setMiniCartOpen, useCart, useMiniCartOpen } from '@/lib/mock-cart/store';
import { routes } from '@/route-paths';
import { CartLineItem } from './cart-line-item';

/** The mini-cart drawer. Lazy-loaded by the header on first open. */
export default function MiniCart() {
    const { site } = useSite();
    const open = useMiniCartOpen();
    const cart = useCart(site.id);
    const close = () => setMiniCartOpen(false);

    return (
        <Sheet open={open} onOpenChange={setMiniCartOpen}>
            <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
                <SheetHeader>
                    <SheetTitle>Your cart ({cart.count})</SheetTitle>
                    <SheetDescription>Demo cart: items are kept in this browser only.</SheetDescription>
                </SheetHeader>
                {cart.lines.length === 0 ? (
                    <p className="px-4 text-sm text-muted-foreground">Your cart is empty.</p>
                ) : (
                    <ul className="flex-1 divide-y divide-border overflow-y-auto px-4">
                        {cart.lines.map((line) => (
                            <CartLineItem key={line.id} line={line} onNavigate={close} />
                        ))}
                    </ul>
                )}
                <SheetFooter className="border-t border-border">
                    {cart.subtotal !== null && (
                        <p className="flex justify-between text-sm font-semibold">
                            <span>Subtotal</span>
                            <span>{formatMoney(cart.subtotal, cart.currency)}</span>
                        </p>
                    )}
                    <ContentLink to={routes.cart} onClick={close} className={buttonVariants({ className: 'w-full' })}>
                        View cart
                    </ContentLink>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
