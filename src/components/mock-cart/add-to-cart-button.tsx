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
import { useState } from 'react';
import { Check, ShoppingCart } from 'lucide-react';
import { useSite } from '@salesforce/storefront-next-runtime/site-context';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { CartProduct } from '@/lib/contentful/product';
import { addItem, setMiniCartOpen } from '@/lib/mock-cart/store';
import { useCommerceTracking } from '@/lib/personalization/use-commerce-tracking';

/** Adds a product to the brand's mock cart, reports it to personalization and opens the mini-cart. */
export function AddToCartButton({
    product,
    quantity = 1,
    className,
    openMiniCart = true,
}: {
    product: CartProduct;
    quantity?: number;
    className?: string;
    openMiniCart?: boolean;
}) {
    const { site } = useSite();
    const tracking = useCommerceTracking();
    const [added, setAdded] = useState(false);

    const handleClick = () => {
        const cart = addItem(site.id, product, quantity);
        tracking.productAdded(product, quantity, cart);
        setAdded(true);
        window.setTimeout(() => setAdded(false), 1500);
        if (openMiniCart) setMiniCartOpen(true);
    };

    return (
        <Button type="button" onClick={handleClick} className={cn('w-full gap-2', className)} data-testid="add-to-cart">
            {added ? <Check className="size-4" /> : <ShoppingCart className="size-4" />}
            {added ? 'Added' : 'Add to cart'}
        </Button>
    );
}
