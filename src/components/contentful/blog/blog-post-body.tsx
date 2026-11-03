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
import type { Options } from '@contentful/rich-text-react-renderer';
import { BLOCKS, INLINES, type Document } from '@contentful/rich-text-types';
import type { ReactNode } from 'react';
import { ContentImage } from '@/components/contentful/content-image';
import { ContentLink } from '@/components/contentful/content-link';
import { CallToAction } from '@/components/contentful/sections/call-to-action';
import { RichText } from '@/components/contentful/sections/rich-text';
import { personName } from '@/lib/contentful/blog';
import { assetUrl } from '@/lib/contentful/media';
import {
    contentTypeId,
    type CallToActionFields,
    type CfAssetShape,
    type CfEntry,
    type CustomerReviewFields,
    type MediaMentionFields,
    type QuoteFields,
} from '@/lib/contentful/types';

type Target = { data?: { target?: CfEntry | CfAssetShape } };
// Unresolvable links (drafts, deleted entries) arrive without fields: render nothing for them.
const targetOf = (node: unknown) => {
    const target = (node as Target).data?.target;
    return target?.fields ? target : undefined;
};

function Testimonial({ quote, attribution }: { quote?: Document; attribution?: string }) {
    if (!quote) return null;
    return (
        <figure className="my-10 border-l-4 border-primary pl-6">
            <blockquote>
                <RichText document={quote} className="text-xl font-semibold leading-snug" />
            </blockquote>
            {attribution && <figcaption className="mt-3 text-sm text-muted-foreground">— {attribution}</figcaption>}
        </figure>
    );
}

function EmbeddedEntry({ entry }: { entry: CfEntry }) {
    switch (contentTypeId(entry)) {
        case 'callToAction':
            return (
                <div className="my-10">
                    <CallToAction cta={entry as CfEntry<CallToActionFields>} />
                </div>
            );
        case 'quote': {
            const f = (entry as CfEntry<QuoteFields>).fields;
            return <Testimonial quote={f.quote} attribution={personName(f.author)} />;
        }
        case 'customerReview': {
            const f = (entry as CfEntry<CustomerReviewFields>).fields;
            return <Testimonial quote={f.review} attribution={personName(f.attribution)} />;
        }
        case 'mediaMention': {
            const f = (entry as CfEntry<MediaMentionFields>).fields;
            return <Testimonial quote={f.quote} attribution={f.source?.fields?.name} />;
        }
        default:
            return null;
    }
}

function EmbeddedAsset({ asset }: { asset: CfAssetShape }) {
    const url = assetUrl(asset);
    if (!url) return null;
    const { title, description, file } = asset.fields;
    if (!file?.contentType?.startsWith('image/')) {
        return (
            <p>
                <a href={url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                    {title || file?.fileName || url}
                </a>
            </p>
        );
    }
    return (
        <figure className="my-10">
            <ContentImage
                image={{
                    url,
                    alt: description || title || '',
                    width: file.details?.image?.width,
                    height: file.details?.image?.height,
                }}
                sizes="(max-width: 768px) 100vw, 45rem"
                widths={[480, 768, 1080, 1440]}
                className="h-auto w-full"
            />
            {description && <figcaption className="mt-2 text-sm text-muted-foreground">{description}</figcaption>}
        </figure>
    );
}

/** A link to an embedded entry: a CTA links to its own target; other embeddable types have no page. */
function EntryLink({ entry, children }: { entry: CfEntry; children: ReactNode }) {
    if (contentTypeId(entry) !== 'callToAction') return <>{children}</>;
    const f = (entry as CfEntry<CallToActionFields>).fields;
    const className = 'underline underline-offset-2';
    if (f.urlTarget) {
        return (
            <ContentLink to={f.urlTarget} className={className}>
                {children}
            </ContentLink>
        );
    }
    return f.internalTarget ? (
        <ContentLink entry={f.internalTarget} className={className}>
            {children}
        </ContentLink>
    ) : (
        <>{children}</>
    );
}

const cell = 'border border-border px-3 py-2 text-left align-top [&_p]:mb-0';

const renderNode: Options['renderNode'] = {
    [BLOCKS.EMBEDDED_ENTRY]: (node) => {
        const entry = targetOf(node) as CfEntry | undefined;
        return entry ? <EmbeddedEntry entry={entry} /> : null;
    },
    [BLOCKS.EMBEDDED_ASSET]: (node) => {
        const asset = targetOf(node) as CfAssetShape | undefined;
        return asset ? <EmbeddedAsset asset={asset} /> : null;
    },
    [BLOCKS.TABLE]: (_node, children) => (
        <div className="my-8 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
                <tbody>{children}</tbody>
            </table>
        </div>
    ),
    [BLOCKS.TABLE_ROW]: (_node, children) => <tr>{children}</tr>,
    [BLOCKS.TABLE_HEADER_CELL]: (_node, children) => <th className={`${cell} bg-muted font-bold`}>{children}</th>,
    [BLOCKS.TABLE_CELL]: (_node, children) => <td className={cell}>{children}</td>,
    [INLINES.ENTRY_HYPERLINK]: (node, children) => {
        const entry = targetOf(node) as CfEntry | undefined;
        return entry ? <EntryLink entry={entry}>{children}</EntryLink> : <>{children}</>;
    },
    [INLINES.ASSET_HYPERLINK]: (node, children) => {
        const url = assetUrl(targetOf(node) as CfAssetShape | undefined);
        return url ? (
            <a href={url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                {children}
            </a>
        ) : (
            <>{children}</>
        );
    },
};

/** A `blogPost` body: the shared rich-text styles plus the embeds and tables the post body allows. */
export function BlogPostBody({ document, className }: { document?: Document; className?: string }) {
    return <RichText document={document} className={className} renderNode={renderNode} />;
}
