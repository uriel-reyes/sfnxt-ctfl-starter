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
import { cn } from '@/lib/utils';
import { ContentLink } from '@/components/contentful/content-link';
import { useInspector } from '@/lib/contentful/inspector';
import { labelForLink } from '@/lib/contentful/links';
import { stripStega } from '@/lib/contentful/live-preview';
import { contentTypeId, type BannerFields, type CfEntry, type CollectionFields } from '@/lib/contentful/types';
import { Banner } from './banner';
import { BannerCarousel } from './banner-carousel';
import { CollectionCard } from './cards';
import { plainText } from '@/lib/contentful/rich-text';
import { RichText } from './rich-text';

function surfaceFor(theme?: string): string {
    if (theme === 'Primary') return 'bg-primary text-primary-foreground';
    if (theme === 'Secondary') return 'bg-secondary text-secondary-foreground';
    return 'bg-background text-foreground';
}

function CollectionHeading({ collection }: { collection: CfEntry<CollectionFields> }) {
    const f = collection.fields;
    if (!f.heading && !f.introduction) return null;
    return (
        <div className="mx-auto mb-10 max-w-2xl text-center">
            {f.heading && <h2 className="text-3xl font-extrabold md:text-4xl">{f.heading}</h2>}
            {f.introduction && <RichText document={f.introduction} className="mt-3 opacity-80" />}
        </div>
    );
}

function CollectionLinks({
    collection,
    className = 'mt-10',
}: {
    collection: CfEntry<CollectionFields>;
    className?: string;
}) {
    const links = collection.fields.links ?? [];
    if (links.length === 0) return null;
    return (
        <div className={cn('flex flex-wrap justify-center gap-3', className)}>
            {links.map((link) => (
                <ContentLink
                    key={link.sys.id}
                    link={link}
                    className="inline-flex items-center rounded-ui border-2 border-current px-8 py-3 text-sm font-extrabold uppercase tracking-wide transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground">
                    {labelForLink(link)}
                </ContentLink>
            ))}
        </div>
    );
}

export function Collection({ collection }: { collection: CfEntry<CollectionFields> }) {
    const cf = useInspector();
    const f = collection.fields;
    const items = (f.items ?? []).filter(Boolean);
    const links = f.links ?? [];
    const layout = stripStega(f.layout) || 'Grid';
    const surface = surfaceFor(f.theme);

    if (layout === 'Carousel (Full)') {
        const slides = items.filter((item) => contentTypeId(item) === 'banner');
        return (
            <section className={cn('w-full', surface)}>
                {(f.heading || f.introduction) && (
                    <div className="mx-auto max-w-7xl px-6 pt-14 md:pt-20">
                        <CollectionHeading collection={collection} />
                    </div>
                )}
                <BannerCarousel>
                    {slides.map((item) => (
                        <Banner key={item.sys.id} banner={item as CfEntry<BannerFields>} />
                    ))}
                </BannerCarousel>
                {links.length > 0 && (
                    <div className="mx-auto max-w-7xl px-6 py-10">
                        <CollectionLinks collection={collection} className="" />
                    </div>
                )}
            </section>
        );
    }

    if (layout === 'Icon Grid') {
        const eyebrow = stripStega(plainText(f.introduction));
        return (
            <section className={cn('w-full', surface)}>
                <div className="mx-auto max-w-7xl px-6 py-14 md:py-20">
                    <div className="grid grid-cols-1 gap-10 lg:grid-cols-3 lg:items-center lg:gap-12">
                        <div>
                            {/* Plain text has no Content Source Map, so the inspector needs a manual tag. */}
                            {eyebrow && (
                                <p
                                    className="text-xs font-semibold uppercase tracking-[0.2em] opacity-70"
                                    {...cf(collection.sys.id, 'introduction')}>
                                    {eyebrow}
                                </p>
                            )}
                            {f.heading && <h2 className="mt-3 text-3xl font-extrabold md:text-4xl">{f.heading}</h2>}
                        </div>
                        <div className="lg:col-span-2 grid grid-cols-2 gap-6 sm:grid-cols-4 sm:gap-8">
                            {items.map((item) => (
                                <CollectionCard key={item.sys.id} item={item} />
                            ))}
                        </div>
                    </div>
                    <CollectionLinks collection={collection} />
                </div>
            </section>
        );
    }

    if (layout === 'Carousel (Multi)') {
        const seeAll = links[0];
        return (
            <section className={cn('w-full', surface)}>
                <div className="mx-auto max-w-7xl px-6 py-14 md:py-20">
                    <div className="mb-8 flex items-end justify-between gap-4">
                        {f.heading && <h2 className="text-2xl font-extrabold md:text-3xl">{f.heading}</h2>}
                        {seeAll && (
                            <ContentLink
                                link={seeAll}
                                className="inline-flex shrink-0 items-center gap-1 text-sm font-extrabold uppercase tracking-wide text-primary hover:underline">
                                {labelForLink(seeAll)}
                                <span aria-hidden>&rarr;</span>
                            </ContentLink>
                        )}
                    </div>
                    <div className="-mx-6 flex snap-x snap-mandatory gap-6 overflow-x-auto px-6 pb-4">
                        {items.map((item) => (
                            <div
                                key={item.sys.id}
                                className="shrink-0 basis-[80%] snap-start sm:basis-[45%] lg:basis-[calc((100%-3rem)/3)]">
                                <CollectionCard item={item} />
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    const isGrid = layout === 'Grid';
    const gridCols = items.length % 4 === 0 ? 'lg:grid-cols-4' : 'lg:grid-cols-3';
    return (
        <section className={cn('w-full', surface)}>
            <div className="mx-auto max-w-7xl px-6 py-14 md:py-20">
                <CollectionHeading collection={collection} />
                <div className={isGrid ? cn('grid grid-cols-1 gap-6 sm:grid-cols-2', gridCols) : 'flex flex-col gap-6'}>
                    {items.map((item) => (
                        <CollectionCard key={item.sys.id} item={item} />
                    ))}
                </div>
                <CollectionLinks collection={collection} />
            </div>
        </section>
    );
}
