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
import { useEffect, useMemo, useState } from 'react';
import { usePreviewMode } from '@/lib/contentful/inspector';
import type { CfEntry } from '@/lib/contentful/types';
import { LIVE_PREVIEW_LOCALE, livePreviewSdk } from './sdk';

type Ref = { sys: { id: string } };

/** The entry IDs of a reference field value (links or resolved entries), in order. */
export function referenceIds(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value
        .map((item) => (item as Partial<Ref> | null | undefined)?.sys?.id)
        .filter((id): id is string => typeof id === 'string');
}

/**
 * `items` rearranged to follow `ids`. Items whose ID is no longer listed are dropped (removed in the editor); IDs with
 * no matching item are skipped (just added in the editor, rendered once the save reload brings their content). An
 * entry linked more than once is matched occurrence by occurrence.
 */
export function orderByIds<T extends Ref>(items: readonly T[], ids: readonly string[]): T[] {
    const byId = new Map<string, T[]>();
    for (const item of items) byId.set(item.sys.id, [...(byId.get(item.sys.id) ?? []), item]);
    return ids.flatMap((id) => {
        const item = byId.get(id)?.shift();
        return item ? [item] : [];
    });
}

type LiveIds = { ownerId: string; fieldId: string; ids: string[] };

/**
 * Under Live Preview, renders `owner.fields[fieldId]` in the order the editor shows it as soon as it changes,
 * instead of after the save, Preview API and route reload round trip. Only the entry IDs are taken from the editor
 * — never its entry graph — and the rendered entries still come from the loader, so nothing drifts from the server
 * render. Outside preview this returns `items` unchanged and loads nothing.
 */
export function useLiveOrder<T extends Ref>(owner: CfEntry | undefined, fieldId: string, items: T[]): T[] {
    const preview = usePreviewMode();
    const [live, setLive] = useState<LiveIds | null>(null);
    const ownerId = owner?.sys.id;
    const ownerSys = owner?.sys;

    useEffect(() => {
        if (!preview || !ownerId || !ownerSys) return;
        let cancelled = false;
        let unsubscribe: VoidFunction | undefined;
        // The editor only needs the entry's identity and the field to track; links keep the message small.
        const data = {
            sys: { ...ownerSys, type: 'Entry' },
            fields: { [fieldId]: referenceIds(owner?.fields[fieldId]).map(toLink) },
        };
        void livePreviewSdk().then((sdk) => {
            if (cancelled || !sdk) return;
            unsubscribe = sdk.subscribe('edit', {
                data,
                locale: LIVE_PREVIEW_LOCALE,
                callback: (updated) => {
                    const fields = (updated as { fields?: Record<string, unknown> }).fields;
                    if (fields) setLive({ ownerId, fieldId, ids: referenceIds(fields[fieldId]) });
                },
            });
        });
        return () => {
            cancelled = true;
            unsubscribe?.();
        };
        // Subscribe once per owner and field; later loader data for the same entry doesn't need a new subscription.
        // oxlint-disable-next-line react-hooks/exhaustive-deps
    }, [preview, ownerId, fieldId]);

    return useMemo(
        () => (live && live.ownerId === ownerId && live.fieldId === fieldId ? orderByIds(items, live.ids) : items),
        [live, ownerId, fieldId, items]
    );
}

function toLink(id: string) {
    return { sys: { type: 'Link', linkType: 'Entry', id } };
}
