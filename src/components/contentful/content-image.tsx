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
import type { ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { stripStega } from '@/lib/contentful/live-preview';
import { imageSrcSet, imageUrl, type ResolvedImage } from '@/lib/contentful/media';

const DEFAULT_WIDTHS = [480, 768, 1080, 1440, 1920] as const;

type ContentImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet' | 'alt'> & {
    image: ResolvedImage;
    /** Rendition widths for the `srcset`. */
    widths?: readonly number[];
    /** Marks the LCP candidate: eager load with high fetch priority. */
    priority?: boolean;
};

/**
 * A Contentful image with Images API renditions (resized WebP `srcset`) and the editor's focal point applied as
 * `object-position`. Non-Contentful URLs (external images) render as-is.
 */
export function ContentImage({
    image,
    widths = DEFAULT_WIDTHS,
    sizes = '100vw',
    priority = false,
    className,
    style,
    ...rest
}: ContentImageProps) {
    const largest = widths[widths.length - 1] ?? 1920;
    return (
        <img
            src={imageUrl(image.url, largest)}
            srcSet={imageSrcSet(image.url, widths)}
            sizes={sizes}
            alt={stripStega(image.alt)}
            width={image.width}
            height={image.height}
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : undefined}
            decoding="async"
            className={cn(className)}
            style={image.objectPosition ? { objectPosition: image.objectPosition, ...style } : style}
            {...rest}
        />
    );
}
