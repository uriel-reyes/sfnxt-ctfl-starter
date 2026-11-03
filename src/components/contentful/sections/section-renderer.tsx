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
import { useInspector } from '@/lib/contentful/inspector';
import { contentTypeId, entryKeys, type CfEntry } from '@/lib/contentful/types';
import { SECTION_TYPES } from './component-renderer';

/** The landing page hero (banner or call to action), full bleed with its heading as the page `h1`. */
export function Hero({
    entry,
    ownerId,
}: {
    entry: CfEntry | undefined;
    /** The entry whose `hero` field links this one, so the Live Preview inspector can open that field. */
    ownerId?: string;
}) {
    const cf = useInspector();
    if (!entry || !SECTION_TYPES.has(contentTypeId(entry))) return null;
    return (
        <div className="w-full overflow-hidden" {...cf(ownerId, 'hero')}>
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
    const cf = useInspector();
    const items = useLiveOrder(
        owner,
        fieldId,
        (sections ?? []).filter((section) => section && SECTION_TYPES.has(contentTypeId(section)))
    );
    if (!items.length) return null;
    const keys = entryKeys(items);
    return (
        <div className="flex flex-col gap-1" {...cf(owner?.sys.id, fieldId)}>
            {items.map((section, index) => (
                <ExperienceBlock key={keys[index]} entry={section} />
            ))}
        </div>
    );
}
