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
import { Trash2 } from 'lucide-react';
import { useSite } from '@salesforce/storefront-next-runtime/site-context';
import { ContentImage } from '@/components/contentful/content-image';
import { ContentLink } from '@/components/contentful/content-link';
import { formatMoney } from '@/lib/contentful/product';
import { type CartLine, removeItem, setQuantity } from '@/lib/mock-cart/store';
import { useCommerceTracking } from '@/lib/personalization/use-commerce-tracking';
import { routes } from '@/route-paths';
import { QuantityStepper } from './quantity-stepper';

export function CartLineItem({ line, onNavigate }: { line: CartLine; onNavigate?: () => void }) {
    const { site } = useSite();
    const tracking = useCommerceTracking();
    const href = `${routes.products}/${line.slug}`;

    return (
        <li className="flex gap-4 py-4" data-testid="cart-line">
            <ContentLink to={href} onClick={onNavigate} className="relative size-20 shrink-0 overflow-hidden bg-muted">
                {line.image && (
                    <ContentImage
                        image={{ ...line.image, alt: line.name }}
                        sizes="80px"
                        widths={[160]}
                        className="absolute inset-0 size-full object-contain p-1 mix-blend-multiply"
                    />
                )}
            </ContentLink>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <ContentLink
                            to={href}
                            onClick={onNavigate}
                            className="line-clamp-2 text-sm font-semibold hover:underline">
                            {line.name}
                        </ContentLink>
                        {line.categoryTitle && <p className="text-xs text-muted-foreground">{line.categoryTitle}</p>}
                    </div>
                    {line.price !== null && (
                        <p className="shrink-0 text-sm font-semibold">
                            {formatMoney(line.price * line.quantity, line.currency)}
                        </p>
                    )}
                </div>
                <div className="flex items-center justify-between">
                    <QuantityStepper
                        value={line.quantity}
                        label={`Quantity for ${line.name}`}
                        onChange={(quantity) => tracking.cartUpdated(setQuantity(site.id, line.id, quantity))}
                    />
                    <button
                        type="button"
                        onClick={() => tracking.productRemoved(line, removeItem(site.id, line.id))}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
                        aria-label={`Remove ${line.name}`}>
                        <Trash2 className="size-4" />
                        Remove
                    </button>
                </div>
            </div>
        </li>
    );
}
