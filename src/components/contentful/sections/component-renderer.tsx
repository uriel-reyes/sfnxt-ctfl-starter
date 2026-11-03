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
    type BannerFields,
    type CallToActionFields,
    type CfEntry,
    type CollectionFields,
} from '@/lib/contentful/types';
import { Banner } from './banner';
import { CallToAction } from './call-to-action';
import { Collection } from './collection';

/** Content types that render as page sections, and that Contentful Personalization can swap for a variant. */
export const SECTION_TYPES = new Set(['banner', 'collection', 'callToAction']);

type EntryProps = Record<string, unknown> & { asHero?: boolean };

/**
 * Renders a resolved entry (the baseline or the selected experience variant) with its section component. Ninetailed's
 * `<Experience>` passes the chosen entry's props here, so the baseline and every variant render identically.
 */
export function ComponentRenderer(props: EntryProps) {
    const { asHero, ...rest } = props;
    const entry = rest as unknown as CfEntry;
    switch (contentTypeId(entry)) {
        case 'banner':
            return <Banner banner={entry as CfEntry<BannerFields>} asHero={asHero} />;
        case 'callToAction':
            return <CallToAction cta={entry as CfEntry<CallToActionFields>} asHero={asHero} />;
        case 'collection':
            return <Collection collection={entry as CfEntry<CollectionFields>} />;
        default:
            return null;
    }
}
