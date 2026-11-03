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
import { createContext, useContext, useMemo } from 'react';
import { useLocation } from 'react-router';

/** Query parameter that turns on Contentful preview (drafts + Live Preview inspector). Its value must be the preview secret. */
export const PREVIEW_PARAM = 'cfpreview';

export type InspectorTags = {
    'data-contentful-entry-id'?: string;
    'data-contentful-field-id'?: string;
    'data-contentful-locale'?: string;
};
type Tagger = (entryId: string | undefined, fieldId: string) => InspectorTags;

const none: Tagger = () => ({});

/** True enables Live Preview tags below it; outside preview every tag is a no-op, so production HTML is unchanged. */
export const InspectorContext = createContext(false);

/**
 * Returns `cf(entryId, fieldId)`: spread its result on the element that renders that Contentful field so the Live
 * Preview inspector can outline it and open the field in the editor.
 */
export function useInspector(): Tagger {
    const enabled = useContext(InspectorContext);
    return useMemo<Tagger>(() => {
        if (!enabled) return none;
        return (entryId, fieldId) =>
            entryId
                ? {
                      'data-contentful-entry-id': entryId,
                      'data-contentful-field-id': fieldId,
                      'data-contentful-locale': 'en-US',
                  }
                : {};
    }, [enabled]);
}

/** True when the page is served in Contentful preview (drafts, Live Preview). */
export function usePreviewMode(): boolean {
    return useContext(InspectorContext);
}

/**
 * The `?cfpreview=…` query to carry on internal links while previewing, so navigation inside the Live Preview iframe
 * stays on drafts (third-party cookies are unreliable in the iframe). Empty outside preview, which the server only
 * enables after validating the secret.
 */
export function usePreviewSearch(): string {
    const enabled = useContext(InspectorContext);
    const { search } = useLocation();
    return useMemo(() => {
        if (!enabled) return '';
        const value = new URLSearchParams(search).get(PREVIEW_PARAM);
        return value ? `?${new URLSearchParams({ [PREVIEW_PARAM]: value }).toString()}` : '';
    }, [enabled, search]);
}
