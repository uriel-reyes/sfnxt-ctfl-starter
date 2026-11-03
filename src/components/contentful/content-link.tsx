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
import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from 'react';
import { Link } from '@/components/link';
import { useBrand } from '@/lib/contentful/brand';
import { usePreviewSearch } from '@/lib/contentful/inspector';
import { stripStega } from '@/lib/contentful/live-preview';
import { resolveHref, resolveLink } from '@/lib/contentful/links';
import type { CfEntry, LinkFields } from '@/lib/contentful/types';
import { useCommerceTracking } from '@/lib/personalization/use-commerce-tracking';

type ContentLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
    children: ReactNode;
} & (
        | { link: CfEntry<LinkFields> | undefined; to?: never; entry?: never }
        | { to: string; link?: never; entry?: never }
        | { entry: CfEntry | undefined; to?: never; link?: never }
    );

/**
 * Renders a Contentful-driven destination: a `link` entry, a routed entry (page, product, category) or a
 * site-relative path. Internal targets go through the project `Link` (site/locale prefix); while previewing they
 * also carry `?cfpreview` so navigation stays on drafts. A link entry's `eventName` is sent to personalization on
 * click.
 */
export function ContentLink({ link, to, entry, children, onClick, ...rest }: ContentLinkProps) {
    const brand = useBrand();
    const previewSearch = usePreviewSearch();
    const tracking = useCommerceTracking();

    const { href, external } = link
        ? resolveLink(link, brand)
        : entry
          ? resolveHref({ entry }, brand)
          : resolveHref({ url: to }, brand);

    const eventName = stripStega(link?.fields?.eventName);
    const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
        if (eventName) tracking.linkClicked(eventName, link?.fields?.eventPayload);
        onClick?.(event);
    };

    if (external) {
        return (
            <a href={href} target="_blank" rel="noopener noreferrer" onClick={handleClick} {...rest}>
                {children}
            </a>
        );
    }

    const target = previewSearch && !href.includes('?') ? `${href}${previewSearch}` : href;
    return (
        <Link to={target} onClick={handleClick} {...rest}>
            {children}
        </Link>
    );
}
