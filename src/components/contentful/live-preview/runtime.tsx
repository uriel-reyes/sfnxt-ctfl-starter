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
import { useEffect, useRef } from 'react';
import { useRevalidator } from 'react-router';
import { livePreviewSdk } from './sdk';

/** Reload as soon as a save lands, then once more in case the Preview API trailed the save (usually under 0.5s). */
const SAVE_RELOAD_DELAYS_MS = [0, 1500];
const EDITOR_ORIGINS = new Set(['https://app.contentful.com', 'https://app.eu.contentful.com']);

/** True for the editor's "entry saved" message (autosave included). */
function isEntrySaved(event: MessageEvent): boolean {
    const data = event.data as { source?: string; method?: string } | null;
    return EDITOR_ORIGINS.has(event.origin) && data?.source === 'live-preview-editor' && data.method === 'ENTRY_SAVED';
}

/**
 * Connects the page to the Contentful editor and reloads the route data after every save, so the page is always the
 * server render of the latest draft. Ahead of that reload, in-editor edits render as they're typed: `useLiveEntry`
 * applies the editor's changes to each rendered entry, and `useLiveOrder` follows the editor's section order by entry
 * ID (taking a reordered list from the editor's merged graph drifts from the loader's entries).
 *
 * Saves are read from the editor's messages directly rather than `ContentfulLivePreview.subscribe('save')`, which
 * drops saves of entries not tagged on the page (e.g. a collection whose items were reordered). Live updates stay
 * enabled, as in Contentful's save-and-reload setup; with them off, the editor waits for a manual "Refresh preview".
 */
export default function LivePreviewRuntime() {
    const revalidator = useRevalidator();
    const revalidate = useRef(revalidator.revalidate);
    revalidate.current = revalidator.revalidate;

    useEffect(() => {
        void livePreviewSdk();

        let timers: number[] = [];
        const onMessage = (event: MessageEvent) => {
            if (!isEntrySaved(event)) return;
            timers.forEach((timer) => window.clearTimeout(timer));
            timers = SAVE_RELOAD_DELAYS_MS.map((ms) => window.setTimeout(() => void revalidate.current(), ms));
        };
        window.addEventListener('message', onMessage);
        return () => {
            window.removeEventListener('message', onMessage);
            timers.forEach((timer) => window.clearTimeout(timer));
        };
    }, []);

    return null;
}
