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
import {
    contentTypeId,
    type CfAsset,
    type ExternalImageFields,
    type ImageWithFocalPointFields,
    type MediaEntry,
} from './types';

export type ResolvedImage = {
    url: string;
    alt: string;
    width?: number;
    height?: number;
    /** CSS `object-position` derived from the editor-set focal point, for `object-cover` crops. */
    objectPosition?: string;
};

/** Normalizes a Contentful asset URL to https. */
export function assetUrl(asset: CfAsset): string | undefined {
    const url = asset?.fields?.file?.url;
    if (!url) return undefined;
    return url.startsWith('//') ? `https:${url}` : url;
}

const isContentfulImage = (url: string) => url.includes('images.ctfassets.net');

/** An Images API rendition of a Contentful image (resized, WebP). Non-Contentful URLs pass through unchanged. */
export function imageUrl(url: string, width: number): string {
    if (!isContentfulImage(url)) return url;
    const params = new URLSearchParams({ w: String(width), fm: 'webp', q: '80' });
    return `${url}${url.includes('?') ? '&' : '?'}${params.toString()}`;
}

/** A `srcset` of Images API renditions; empty for non-Contentful URLs. */
export function imageSrcSet(url: string, widths: readonly number[]): string | undefined {
    if (!isContentfulImage(url)) return undefined;
    return widths.map((w) => `${imageUrl(url, w)} ${w}w`).join(', ');
}

/** Pulls a usable image from an `imageWithFocalPoint` or `externalImage` entry. */
export function resolveMedia(media: MediaEntry | undefined): ResolvedImage | null {
    if (!media) return null;
    const type = contentTypeId(media);

    if (type === 'imageWithFocalPoint') {
        const fields = media.fields as ImageWithFocalPointFields;
        const asset = fields.image;
        const url = assetUrl(asset);
        if (!url) return null;
        const details = asset?.fields?.file?.details;
        const width = details?.image?.width;
        const height = details?.image?.height;

        const fp = fields.focalPoint?.focalPoint;
        let objectPosition: string | undefined;
        if (fp && width && height) {
            const clamp = (n: number) => Math.min(100, Math.max(0, n));
            objectPosition = `${clamp((fp.x / width) * 100)}% ${clamp((fp.y / height) * 100)}%`;
        }

        return { url, alt: fields.altText || asset?.fields?.title || '', width, height, objectPosition };
    }

    if (type === 'externalImage') {
        const img = (media.fields as ExternalImageFields).image;
        if (!img?.url) return null;
        return { url: img.url, alt: (img.alt as string) || '' };
    }

    return null;
}
