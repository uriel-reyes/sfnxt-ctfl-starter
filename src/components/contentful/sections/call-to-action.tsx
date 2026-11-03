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
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { ContentImage } from '@/components/contentful/content-image';
import { ContentLink } from '@/components/contentful/content-link';
import { useInspector } from '@/lib/contentful/inspector';
import { resolveMedia } from '@/lib/contentful/media';
import type { CallToActionFields, CfEntry } from '@/lib/contentful/types';
import { RichText } from './rich-text';

const BUTTON =
    'mt-8 inline-flex items-center rounded-ui px-8 py-3.5 text-sm font-extrabold uppercase tracking-wide transition-colors bg-primary text-primary-foreground hover:bg-primary/90';

function CtaButton({ cta }: { cta: CfEntry<CallToActionFields> }) {
    const f = cta.fields;
    if (!f.label) return null;
    const label: ReactNode = f.label;
    if (f.urlTarget) {
        return (
            <ContentLink to={f.urlTarget} className={BUTTON}>
                {label}
            </ContentLink>
        );
    }
    return (
        <ContentLink entry={f.internalTarget} className={BUTTON}>
            {label}
        </ContentLink>
    );
}

export function CallToAction({ cta, asHero = false }: { cta: CfEntry<CallToActionFields>; asHero?: boolean }) {
    const cf = useInspector();
    const f = cta.fields;
    const media = resolveMedia(f.media);

    if (asHero) {
        return (
            <section className="relative w-full overflow-hidden min-h-[480px] md:min-h-[560px]">
                {media && (
                    <div className="absolute inset-0" {...cf(cta.sys.id, 'media')}>
                        <ContentImage image={media} priority className="size-full object-cover" />
                    </div>
                )}
                {media && <div className="absolute inset-0 bg-brand-black/30" />}
                <div className="relative mx-auto flex min-h-[480px] max-w-7xl items-center px-6 md:min-h-[560px]">
                    <div
                        className={cn(
                            'max-w-xl',
                            media && 'text-brand-white [text-shadow:0_1px_16px_rgb(0_0_0/0.35)]'
                        )}>
                        {f.heading && (
                            <h1 className="text-4xl font-extrabold leading-tight md:text-6xl">{f.heading}</h1>
                        )}
                        {f.body && <RichText document={f.body} className="mt-4 text-lg" />}
                        <CtaButton cta={cta} />
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="w-full bg-secondary text-secondary-foreground">
            <div className="mx-auto flex max-w-4xl flex-col items-center px-6 py-16 text-center md:py-20">
                {media && (
                    <div
                        className="relative mb-8 aspect-video w-full max-w-2xl overflow-hidden"
                        {...cf(cta.sys.id, 'media')}>
                        <ContentImage
                            image={media}
                            sizes="(max-width: 768px) 100vw, 42rem"
                            widths={[480, 768, 1080, 1440]}
                            className="absolute inset-0 size-full object-cover"
                        />
                    </div>
                )}
                {f.heading && <h2 className="text-3xl font-extrabold md:text-4xl">{f.heading}</h2>}
                {f.body && <RichText document={f.body} className="mt-4 max-w-2xl opacity-80" />}
                <CtaButton cta={cta} />
            </div>
        </section>
    );
}
