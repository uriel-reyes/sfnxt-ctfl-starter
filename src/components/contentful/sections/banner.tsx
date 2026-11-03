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
import { ContentImage } from '@/components/contentful/content-image';
import { ContentLink } from '@/components/contentful/content-link';
import { useInspector } from '@/lib/contentful/inspector';
import { labelForLink } from '@/lib/contentful/links';
import { stripStega } from '@/lib/contentful/live-preview';
import { resolveMedia } from '@/lib/contentful/media';
import type { BannerFields, CfEntry } from '@/lib/contentful/types';
import { RichText } from './rich-text';

const SIZE_MIN_HEIGHT: Record<string, string> = {
    Large: 'min-h-[520px] md:min-h-[600px]',
    Medium: 'min-h-[380px] md:min-h-[440px]',
    Small: 'min-h-[260px] md:min-h-[300px]',
    'Full Height': 'min-h-[calc(100vh-10rem)]',
};

const CONTENT_POSITION: Record<string, string> = {
    'top-left': 'items-start justify-start text-left',
    'top-center': 'items-start justify-center text-center',
    'top-right': 'items-start justify-end text-right',
    'middle-left': 'items-center justify-start text-left',
    'middle-center': 'items-center justify-center text-center',
    'middle-right': 'items-center justify-end text-right',
    'bottom-left': 'items-end justify-start text-left',
    'bottom-center': 'items-end justify-center text-center',
    'bottom-right': 'items-end justify-end text-right',
};

/** Directional scrim so overlaid text stays legible over any background image. */
function scrimGradient(contentPosition: string): string {
    if (contentPosition.endsWith('left'))
        return 'bg-gradient-to-r from-brand-black/70 via-brand-black/35 to-transparent';
    if (contentPosition.endsWith('right'))
        return 'bg-gradient-to-l from-brand-black/70 via-brand-black/35 to-transparent';
    return 'bg-gradient-to-t from-brand-black/60 via-brand-black/30 to-brand-black/20';
}

const PRIMARY_BUTTON = 'bg-primary text-primary-foreground hover:bg-primary/90';

function themeClasses(theme?: string): { surface: string; button: string; body: string } {
    switch (theme) {
        case 'Primary':
            return {
                surface: 'bg-primary text-primary-foreground',
                button: 'bg-primary-foreground text-primary hover:bg-primary-foreground/90',
                body: 'text-primary-foreground/90',
            };
        case 'Secondary':
            return { surface: 'bg-secondary text-secondary-foreground', button: PRIMARY_BUTTON, body: 'opacity-80' };
        default:
            return { surface: 'bg-card text-card-foreground', button: PRIMARY_BUTTON, body: 'text-muted-foreground' };
    }
}

function linksJustify(contentPosition: string): string {
    if (contentPosition.endsWith('center')) return 'justify-center';
    if (contentPosition.endsWith('right')) return 'justify-end';
    return 'justify-start';
}

function BannerContent({
    banner,
    buttonClass,
    justify,
    bodyClass,
    asHero,
}: {
    banner: CfEntry<BannerFields>;
    buttonClass: string;
    justify: string;
    bodyClass: string;
    asHero: boolean;
}) {
    const f = banner.fields;
    const Heading = asHero ? 'h1' : 'h2';
    const links = f.links ?? [];
    return (
        <>
            {f.heading && <Heading className="text-3xl font-extrabold leading-tight md:text-5xl">{f.heading}</Heading>}
            {f.body && (
                <div className={cn('mt-4', bodyClass)}>
                    <RichText document={f.body} />
                </div>
            )}
            {links.length > 0 && (
                <div className={cn('mt-8 flex flex-wrap gap-3', justify)}>
                    {links.map((link) => (
                        <ContentLink
                            key={link.sys.id}
                            link={link}
                            className={cn(
                                'inline-flex items-center rounded-ui px-8 py-3.5 text-sm font-extrabold uppercase tracking-wide transition-colors',
                                buttonClass
                            )}>
                            {labelForLink(link)}
                        </ContentLink>
                    ))}
                </div>
            )}
        </>
    );
}

export function Banner({ banner, asHero = false }: { banner: CfEntry<BannerFields>; asHero?: boolean }) {
    const cf = useInspector();
    const f = banner.fields;
    const media = resolveMedia(f.media);
    const size = f.size ?? 'Medium';
    const theme = themeClasses(f.theme);
    const contentPosition = stripStega(f.contentPosition) || 'middle-left';
    const contentAlign = CONTENT_POSITION[contentPosition] ?? CONTENT_POSITION['middle-left'];
    const minHeight = SIZE_MIN_HEIGHT[size] ?? SIZE_MIN_HEIGHT.Medium;

    if (f.mediaPosition === 'Background' || !f.mediaPosition) {
        return (
            <section className={cn('relative w-full overflow-hidden', minHeight, !media && theme.surface)}>
                {media && (
                    <div className="absolute inset-0" {...cf(banner.sys.id, 'media')}>
                        <ContentImage image={media} priority={asHero} className="size-full object-cover" />
                    </div>
                )}
                {media && <div className={cn('absolute inset-0', scrimGradient(contentPosition))} />}
                <div className="absolute inset-0 px-6 py-12">
                    <div className={cn('mx-auto flex h-full w-full max-w-7xl', contentAlign)}>
                        <div
                            className={cn(
                                'max-w-xl',
                                media && 'text-brand-white [text-shadow:0_1px_16px_rgb(0_0_0/0.35)]'
                            )}>
                            <BannerContent
                                banner={banner}
                                asHero={asHero}
                                buttonClass={media ? PRIMARY_BUTTON : theme.button}
                                justify={linksJustify(contentPosition)}
                                bodyClass={media ? 'text-base md:text-lg' : theme.body}
                            />
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    const mediaFirst = f.mediaPosition === 'Left Half';
    return (
        <section className={cn('w-full', theme.surface)}>
            <div className="mx-auto grid max-w-7xl grid-cols-1 items-stretch md:grid-cols-2">
                <div
                    className={cn('relative min-h-[280px] md:min-h-[420px]', mediaFirst ? 'md:order-1' : 'md:order-2')}
                    {...cf(banner.sys.id, 'media')}>
                    {media && (
                        <ContentImage
                            image={media}
                            priority={asHero}
                            sizes="(max-width: 768px) 100vw, 50vw"
                            widths={[480, 768, 1080, 1440]}
                            className="absolute inset-0 size-full object-cover"
                        />
                    )}
                </div>
                <div className={cn('flex items-center px-6 py-12 md:px-12', mediaFirst ? 'md:order-2' : 'md:order-1')}>
                    <div className="max-w-lg">
                        <BannerContent
                            banner={banner}
                            asHero={asHero}
                            buttonClass={theme.button}
                            justify="justify-start"
                            bodyClass={theme.body}
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}
