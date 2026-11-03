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
import { useConfig } from '@salesforce/storefront-next-runtime/config';
import { buildUrl, useSite } from '@salesforce/storefront-next-runtime/site-context';
import { cn } from '@/lib/utils';
import { usePreviewSearch } from '@/lib/contentful/inspector';
import { imageUrl } from '@/lib/contentful/media';
import type { BrandTab } from '@/lib/contentful/types';

/**
 * The family-of-brands switcher above the header. Each tab is a brand site's home; switching is a full document
 * navigation because it changes the site context (navigation, cart and personalization are per brand).
 */
export function BrandTabs({ tabs }: { tabs: BrandTab[] }) {
    const config = useConfig();
    const { site, locale } = useSite();
    const previewSearch = usePreviewSearch();

    if (tabs.length < 2) return null;

    return (
        <nav aria-label="Our brands" className="bg-muted text-muted-foreground border-b border-border">
            <div className="section-container flex items-stretch justify-end gap-1 h-10 overflow-x-auto">
                {tabs.map((tab) => {
                    const active = tab.siteId === site.id;
                    const href = buildUrl({
                        to: '/',
                        urlConfig: config.url,
                        params: { siteId: config.siteAliasMap?.[tab.siteId] ?? tab.siteId, localeId: locale.id },
                    });
                    return (
                        <a
                            key={tab.siteId}
                            href={`${href}${previewSearch}`}
                            aria-current={active ? 'page' : undefined}
                            data-testid={`brand-tab-${tab.siteId}`}
                            className={cn(
                                'flex items-center px-5 border-b-2 text-sm font-medium transition-colors shrink-0',
                                active
                                    ? 'border-primary bg-background text-foreground'
                                    : 'border-transparent hover:bg-background/60 hover:text-foreground'
                            )}>
                            {tab.logoUrl ? (
                                <img
                                    src={imageUrl(tab.logoUrl, 240)}
                                    alt={tab.name}
                                    className={cn(
                                        'h-6 w-auto max-w-28 object-contain transition',
                                        !active && 'opacity-60 grayscale hover:opacity-100 hover:grayscale-0'
                                    )}
                                    loading="eager"
                                    decoding="async"
                                />
                            ) : (
                                <span>{tab.name}</span>
                            )}
                        </a>
                    );
                })}
            </div>
        </nav>
    );
}
