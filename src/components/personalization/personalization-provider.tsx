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
import { type ReactNode, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router';
import { Ninetailed } from '@ninetailed/experience.js';
import { NinetailedProvider, useNinetailed } from '@ninetailed/experience.js-react';
import { NinetailedInsightsPlugin } from '@ninetailed/experience.js-plugin-insights';
import { NinetailedPreviewPlugin } from '@ninetailed/experience.js-plugin-preview';
import { useConfig } from '@salesforce/storefront-next-runtime/config';
import type { PersonalizationPreviewData } from '@/lib/contentful/types';

/**
 * A browser holding a profile id minted under a different Ninetailed namespace (client id or environment changed)
 * gets `ERR_NAMESPACE_MISMATCH` on every profile fetch. One `reset()` per page load mints a fresh profile.
 */
let didResetForNamespaceMismatch = false;

function handleNinetailedError(error: unknown) {
    const code = (error as { code?: string } | null)?.code;
    const message = error instanceof Error ? error.message : String(error ?? '');
    const isNamespaceMismatch =
        code === 'ERR_NAMESPACE_MISMATCH' ||
        message.includes('ERR_NAMESPACE_MISMATCH') ||
        message.includes('Could not find the requested profile');
    if (isNamespaceMismatch && !didResetForNamespaceMismatch && typeof window !== 'undefined') {
        didResetForNamespaceMismatch = true;
        window.ninetailed?.reset();
    }
}

function contentfulEntryOpener(spaceId: string | undefined, environment: string | undefined) {
    if (!spaceId) return undefined;
    return (entryId: string) => {
        if (!entryId) return;
        window.open(
            `https://app.contentful.com/spaces/${spaceId}/environments/${environment || 'master'}/entries/${entryId}`,
            '_blank',
            'noopener,noreferrer'
        );
    };
}

/**
 * The browser's Ninetailed instance. `NinetailedProvider` creates one per mount, and every instance's preview plugin
 * injects its own widget that is never removed, so remounts (StrictMode, the lazy Live Preview runtime) would leave
 * stale widgets driving instances the page no longer reads. The first mount's configuration wins for the page.
 */
let browserInstance: Ninetailed | undefined;

/** React Router navigations are client-side, so each pathname change is reported as a Ninetailed page view. */
function PageTracker() {
    const { pathname } = useLocation();
    const { page } = useNinetailed();
    useEffect(() => {
        void page().catch(() => undefined);
    }, [pathname, page]);
    return null;
}

/**
 * Initializes Contentful Personalization (Ninetailed) for the storefront. The Insights plugin measures component
 * views and clicks for experiment results; the preview plugin (experience/audience switcher) is only added when the
 * layout passes `previewData`, which it does in development and in Contentful preview.
 */
export function PersonalizationProvider({
    children,
    previewData,
}: {
    children: ReactNode;
    previewData: PersonalizationPreviewData | null;
}) {
    const config = useConfig();
    const { clientId, environment } = config.personalization;
    const space = config.contentful.spaces.brand;

    const ninetailed = useMemo(() => {
        if (typeof window !== 'undefined' && browserInstance) return browserInstance;
        const plugins: (NinetailedInsightsPlugin | NinetailedPreviewPlugin)[] = [new NinetailedInsightsPlugin()];
        if (previewData && typeof window !== 'undefined') {
            const openEntry = contentfulEntryOpener(space?.spaceId, space?.environment);
            plugins.push(
                new NinetailedPreviewPlugin({
                    experiences: previewData.experiences,
                    audiences: previewData.audiences,
                    ...(openEntry
                        ? {
                              onOpenExperienceEditor: (experience) => openEntry(experience.id),
                              onOpenAudienceEditor: (audience) => openEntry(audience.id),
                          }
                        : {}),
                })
            );
        }
        const instance = new Ninetailed(
            { clientId: clientId || 'unconfigured', environment: environment || 'main' },
            { plugins, onError: handleNinetailedError }
        );
        if (typeof window !== 'undefined') browserInstance = instance;
        return instance;
    }, [clientId, environment, previewData, space?.spaceId, space?.environment]);

    return (
        <NinetailedProvider ninetailed={ninetailed}>
            {typeof window !== 'undefined' && <PageTracker />}
            {children}
        </NinetailedProvider>
    );
}
