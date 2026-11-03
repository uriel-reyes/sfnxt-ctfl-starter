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
import { ExperienceBlock } from '@/components/personalization/experience-block';
import { contentTypeId, entryKeys, type CfEntry } from '@/lib/contentful/types';
import { SECTION_TYPES } from './component-renderer';

/** The landing page hero (banner or call to action), full bleed with its heading as the page `h1`. */
export function Hero({ entry }: { entry: CfEntry | undefined }) {
    if (!entry || !SECTION_TYPES.has(contentTypeId(entry))) return null;
    return (
        <div className="w-full overflow-hidden">
            <ExperienceBlock entry={entry} asHero />
        </div>
    );
}

export function Sections({ sections }: { sections: CfEntry[] | undefined }) {
    const items = (sections ?? []).filter((section) => section && SECTION_TYPES.has(contentTypeId(section)));
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
