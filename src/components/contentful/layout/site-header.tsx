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
import { lazy, Suspense, useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { useSite } from '@salesforce/storefront-next-runtime/site-context';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ContentLink } from '@/components/contentful/content-link';
import { SignIn } from '@/components/personalization/sign-in';
import { useBrand } from '@/lib/contentful/brand';
import { useInspector } from '@/lib/contentful/inspector';
import { imageUrl } from '@/lib/contentful/media';
import {
    contentTypeId,
    type BrandTab,
    type CfEntry,
    type LinkFields,
    type NavigationFields,
} from '@/lib/contentful/types';
import { setMiniCartOpen, useCart, useMiniCartOpen } from '@/lib/mock-cart/store';
import { routes } from '@/route-paths';

const MiniCart = lazy(() => import('@/components/mock-cart/mini-cart'));

function NavItem({ item, className }: { item: CfEntry<NavigationFields>; className: string }) {
    const cf = useInspector();
    const target = item.fields.target;
    const label = item.fields.label || (target?.fields?.label as string | undefined) || '';
    if (!label) return null;
    return contentTypeId(target) === 'link' ? (
        <ContentLink link={target as CfEntry<LinkFields>} className={className} {...cf(item.sys.id, 'label')}>
            {label}
        </ContentLink>
    ) : (
        <ContentLink entry={target} className={className} {...cf(item.sys.id, 'label')}>
            {label}
        </ContentLink>
    );
}

function CartButton() {
    const { site } = useSite();
    const { count } = useCart(site.id);
    const open = useMiniCartOpen();
    // The drawer is mounted on first open only (header click or add to cart), so its code is not part of the
    // initial page load.
    const [mounted, setMounted] = useState(false);
    if (open && !mounted) setMounted(true);
    return (
        <>
            <Button
                variant="ghost"
                size="icon"
                className="relative text-header-foreground hover:bg-transparent hover:opacity-70"
                aria-label={count ? `Cart, ${count} items` : 'Cart'}
                data-testid="header-cart"
                onClick={() => setMiniCartOpen(true)}>
                <ShoppingCart className="size-5" />
                {count > 0 && (
                    <Badge className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full px-1 text-xs">
                        {count}
                    </Badge>
                )}
            </Button>
            {mounted && (
                <Suspense fallback={null}>
                    <MiniCart />
                </Suspense>
            )}
        </>
    );
}

export function SiteHeader({
    navigation,
    tab,
}: {
    navigation: CfEntry<NavigationFields>[];
    tab: BrandTab | undefined;
}) {
    const brand = useBrand();
    const name = brand?.name ?? tab?.name ?? '';
    const linkClass =
        'text-sm font-semibold uppercase tracking-wide whitespace-nowrap hover:opacity-70 transition-opacity';

    return (
        <header className="bg-header-background text-header-foreground sticky top-0 z-50 border-b border-header-border [@media(max-height:400px)]:static">
            <div className="section-container">
                <div className="flex items-center gap-6 h-16">
                    <ContentLink to={routes.home} className="shrink-0 flex items-center" data-testid="header-logo">
                        {tab?.logoUrl ? (
                            <img
                                src={imageUrl(tab.logoUrl, 400)}
                                alt={`${name} home`}
                                className="h-9 lg:h-10 w-auto max-w-44 object-contain"
                                loading="eager"
                                fetchPriority="high"
                            />
                        ) : (
                            <span className="text-xl font-bold">{name}</span>
                        )}
                    </ContentLink>
                    <nav aria-label="Main" className="hidden md:flex items-center gap-6 min-w-0 flex-1">
                        {navigation.map((item) => (
                            <NavItem key={item.sys.id} item={item} className={linkClass} />
                        ))}
                    </nav>
                    <div className="flex-1 md:hidden" />
                    <div className="flex items-center gap-1">
                        <SignIn />
                        <CartButton />
                    </div>
                </div>
                {navigation.length > 0 && (
                    <nav aria-label="Main mobile" className="md:hidden flex items-center gap-5 overflow-x-auto pb-3">
                        {navigation.map((item) => (
                            <NavItem key={item.sys.id} item={item} className={linkClass} />
                        ))}
                    </nav>
                )}
            </div>
        </header>
    );
}
