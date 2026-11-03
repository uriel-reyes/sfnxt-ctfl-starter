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
import { useLiveOrder } from '@/components/contentful/live-preview/use-live-order';
import { ExperienceBlock } from '@/components/personalization/experience-block';
import { contentTypeId, entryKeys, type CfEntry } from '@/lib/contentful/types';
import { SECTION_TYPES } from './component-renderer';

/**
 * The landing page hero (banner or call to action), full bleed with its heading as the page `h1`.
 *
 * Neither this wrapper nor the sections wrapper carries a Live Preview inspector tag: the inspector ignores the
 * Content Source Map tags of all text inside a manually tagged element, so a tag here would send every click in the
 * hero to the page instead of to the entry that holds the text.
 */
export function Hero({ entry }: { entry: CfEntry | undefined }) {
    if (!entry || !SECTION_TYPES.has(contentTypeId(entry))) return null;
    return (
        <div className="w-full overflow-hidden">
            <ExperienceBlock entry={entry} asHero />
        </div>
    );
}

/**
 * The sections listed in `owner.fields[fieldId]`. Under Live Preview they follow the editor's order as soon as it
 * changes, without waiting for the save reload.
 */
export function Sections({
    sections,
    owner,
    fieldId = 'sections',
}: {
    sections: CfEntry[] | undefined;
    /** The entry whose field lists these sections. */
    owner: CfEntry | undefined;
    fieldId?: string;
}) {
    const items = useLiveOrder(
        owner,
        fieldId,
        (sections ?? []).filter((section) => section && SECTION_TYPES.has(contentTypeId(section)))
    );
    if (!items.length) return null;
    const keys = entryKeys(items);
    return (
        <div className="flex flex-col gap-1">
            {items.map((section, index) => (
                <ExperienceBlock key={keys[index]} entry={section} />
            ))}
        </div>
    );
}
