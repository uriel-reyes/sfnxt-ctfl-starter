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
import { documentToReactComponents, type Options } from '@contentful/rich-text-react-renderer';
import { BLOCKS, INLINES, type Document } from '@contentful/rich-text-types';
import { ContentLink } from '@/components/contentful/content-link';

const options: Options = {
    renderNode: {
        [BLOCKS.PARAGRAPH]: (_node, children) => (
            <p className="mb-4 last:mb-0 whitespace-pre-line leading-relaxed">{children}</p>
        ),
        [BLOCKS.HEADING_1]: (_node, children) => <h2 className="mb-4 text-4xl font-bold">{children}</h2>,
        [BLOCKS.HEADING_2]: (_node, children) => <h2 className="mb-3 text-3xl font-bold">{children}</h2>,
        [BLOCKS.HEADING_3]: (_node, children) => <h3 className="mb-3 text-2xl font-semibold">{children}</h3>,
        [BLOCKS.HEADING_4]: (_node, children) => <h4 className="mb-2 text-xl font-semibold">{children}</h4>,
        [BLOCKS.HEADING_5]: (_node, children) => <h5 className="mb-2 text-lg font-semibold">{children}</h5>,
        [BLOCKS.HEADING_6]: (_node, children) => (
            <h6 className="mb-2 text-base font-semibold uppercase tracking-wide">{children}</h6>
        ),
        [BLOCKS.HR]: () => <hr className="my-8 border-border" />,
        [BLOCKS.UL_LIST]: (_node, children) => <ul className="mb-4 list-disc space-y-1 pl-6">{children}</ul>,
        [BLOCKS.OL_LIST]: (_node, children) => <ol className="mb-4 list-decimal space-y-1 pl-6">{children}</ol>,
        [BLOCKS.QUOTE]: (_node, children) => (
            <blockquote className="mb-4 border-l-4 border-primary pl-4 italic opacity-80">{children}</blockquote>
        ),
        [INLINES.HYPERLINK]: (node, children) => (
            <ContentLink
                to={String((node.data as { uri?: string }).uri ?? '/')}
                className="underline underline-offset-2">
                {children}
            </ContentLink>
        ),
    },
};

/**
 * Renders a Contentful rich-text field. `renderNode` adds or overrides node renderers (e.g. embedded entries in a
 * blog post body) on top of the defaults.
 */
export function RichText({
    document,
    className,
    renderNode,
}: {
    document?: Document;
    className?: string;
    renderNode?: Options['renderNode'];
}) {
    if (!document) return null;
    const merged = renderNode ? { ...options, renderNode: { ...options.renderNode, ...renderNode } } : options;
    return <div className={className}>{documentToReactComponents(document, merged)}</div>;
}
