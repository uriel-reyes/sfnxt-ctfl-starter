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
import { Children, type ReactNode, useCallback, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePreviewMode } from '@/lib/contentful/inspector';

const ARROW =
    'absolute top-1/2 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-brand-black/40 text-brand-white backdrop-blur transition-colors hover:bg-brand-black/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

/** Full-bleed slider for banner slides, advanced manually (no auto-rotation). */
export function BannerCarousel({ children }: { children: ReactNode }) {
    const slides = Children.toArray(children);
    const count = slides.length;
    const [index, setIndex] = useState(0);
    // A CSS `transform` ancestor breaks the Live Preview inspector's overlay positioning, so preview renders the
    // active slide untransformed.
    const editing = usePreviewMode();
    const go = useCallback((next: number) => setIndex(((next % count) + count) % count), [count]);

    if (count === 0) return null;
    if (count === 1) return <>{slides[0]}</>;

    return (
        <div
            className="relative w-full overflow-hidden"
            role="region"
            aria-roledescription="carousel"
            aria-label="Featured">
            {editing ? (
                <div role="group" aria-roledescription="slide" aria-label={`${index + 1} of ${count}`}>
                    {slides[index]}
                </div>
            ) : (
                <div
                    className="flex transition-transform duration-500 ease-out"
                    style={{ transform: `translateX(-${index * 100}%)` }}>
                    {slides.map((slide, i) => (
                        <div
                            // oxlint-disable-next-line react/no-array-index-key -- slides are positional
                            key={i}
                            className="w-full shrink-0"
                            role="group"
                            aria-roledescription="slide"
                            aria-label={`${i + 1} of ${count}`}
                            aria-hidden={i !== index}
                            inert={i !== index}>
                            {slide}
                        </div>
                    ))}
                </div>
            )}
            <button
                type="button"
                onClick={() => go(index - 1)}
                aria-label="Previous slide"
                className={cn(ARROW, 'left-4')}>
                <ChevronLeft className="size-6" />
            </button>
            <button
                type="button"
                onClick={() => go(index + 1)}
                aria-label="Next slide"
                className={cn(ARROW, 'right-4')}>
                <ChevronRight className="size-6" />
            </button>
            <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2">
                {slides.map((_, i) => (
                    <button
                        // oxlint-disable-next-line react/no-array-index-key -- slides are positional
                        key={i}
                        type="button"
                        onClick={() => go(i)}
                        aria-label={`Go to slide ${i + 1}`}
                        aria-current={i === index}
                        className={cn(
                            'h-2 rounded-full transition-all',
                            i === index ? 'w-6 bg-brand-white' : 'w-2 bg-brand-white/50'
                        )}
                    />
                ))}
            </div>
        </div>
    );
}
