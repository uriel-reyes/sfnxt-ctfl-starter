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
import { useMemo } from 'react';
import { Experience } from '@ninetailed/experience.js-react';
import { ExperienceMapper, type ExperienceEntryLike } from '@ninetailed/experience.js-utils-contentful';
import { ComponentRenderer } from '@/components/contentful/sections/component-renderer';
import { useLiveEntry } from '@/components/contentful/live-preview/use-live-entry';
import { breakCycles, normalizeExperienceIds } from '@/lib/contentful/live-preview';
import { contentTypeId, type CfEntry } from '@/lib/contentful/types';

/** Fields the loader fills in rather than Contentful (see `resolveDynamicCollections`); live edits keep the loader's. */
const LOADER_FIELDS: Partial<Record<string, readonly string[]>> = { dynamicCollection: ['items'] };

/**
 * Wraps a personalizable entry in Ninetailed's `<Experience>`. The experiences attached to the entry
 * (`fields.nt_experiences`, resolved by the page's deep `include`) are mapped to the SDK format; when the visitor
 * is assigned a variant (A/B split or audience match) the variant entry renders instead of the baseline.
 */
export function ExperienceBlock({ entry: loaded, asHero = false }: { entry: CfEntry; asHero?: boolean }) {
    // Under Live Preview, the editor's unsaved changes to this entry (and the entries it links) render as they're typed.
    const entry = useLiveEntry(loaded, { loaderFields: LOADER_FIELDS[contentTypeId(loaded)] });
    const experiences = useMemo(
        () =>
            breakCycles(
                ((entry.fields.nt_experiences as ExperienceEntryLike[] | undefined) ?? [])
                    .filter((experience) => ExperienceMapper.isExperienceEntry(experience))
                    .map((experience) => ExperienceMapper.mapExperience(experience))
                    .map(normalizeExperienceIds)
            ),
        [entry]
    );
    // Ninetailed serializes the baseline and variants with JSON.stringify for its insights/preview channel, so it
    // must get a cycle-free clone.
    const baseline = useMemo(() => breakCycles(entry), [entry]);

    return (
        <Experience
            {...(baseline as unknown as Record<string, unknown>)}
            id={entry.sys.id}
            component={ComponentRenderer}
            experiences={experiences}
            passthroughProps={{ asHero }}
            trackClicks
        />
    );
}
