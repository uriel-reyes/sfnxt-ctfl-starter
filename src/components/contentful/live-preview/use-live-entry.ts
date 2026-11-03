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
import { useEffect, useRef, useState } from 'react';
import { usePreviewMode } from '@/lib/contentful/inspector';
import { LIVE_PREVIEW_LOCALE, livePreviewSdk } from './sdk';

type Entry = { sys: { id: string; updatedAt?: string } };

/** True when `a` was saved after `b`. Unknown timestamps count as newer, so loader data wins when in doubt. */
export function isNewer(a: Entry, b: Entry): boolean {
    const left = Date.parse(a.sys.updatedAt ?? '');
    const right = Date.parse(b.sys.updatedAt ?? '');
    return Number.isNaN(left) || Number.isNaN(right) || left > right;
}

/**
 * Under Live Preview, `entry` with the editor's unsaved changes merged in, updated as the editor types. This is the
 * SDK's `subscribe('edit')` — the mechanism behind its `useContentfulLiveUpdates` — with two differences: it waits
 * for the shared `init()` (so the SDK stays out of the regular bundle), and a save reload that reaches the Preview
 * API before the save does can't undo a live edit: loader data replaces the live copy only once it is newer.
 * Outside preview this returns `entry` unchanged and loads nothing.
 */
export function useLiveEntry<T extends Entry | null | undefined>(entry: T): T {
    const preview = usePreviewMode();
    const [live, setLive] = useState<NonNullable<T> | null>(null);
    const current =
        entry && live && live.sys.id === entry.sys.id && !isNewer(entry, live) ? (live as unknown as T) : entry;
    const sent = useRef(current);
    sent.current = current;

    useEffect(() => {
        if (!preview || !entry) return;
        let cancelled = false;
        let unsubscribe: VoidFunction | undefined;
        void livePreviewSdk().then((sdk) => {
            if (cancelled || !sdk || !sent.current) return;
            unsubscribe = sdk.subscribe('edit', {
                // The editor merges each change into the copy it was given, so give it the latest one.
                data: sent.current as never,
                locale: LIVE_PREVIEW_LOCALE,
                callback: (updated) => setLive(updated as unknown as NonNullable<T>),
            });
        });
        return () => {
            cancelled = true;
            unsubscribe?.();
        };
    }, [preview, entry]);

    return current;
}
