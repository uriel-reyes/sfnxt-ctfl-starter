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
import type { ReactNode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InspectorContext } from '@/lib/contentful/inspector';
import type { CfEntry } from '@/lib/contentful/types';
import { orderByIds, referenceIds, useLiveOrder } from './use-live-order';

const subscribe = vi.fn();
vi.mock('./sdk', () => ({
    LIVE_PREVIEW_LOCALE: 'en-US',
    livePreviewSdk: () => Promise.resolve({ subscribe }),
}));

const entry = (id: string): CfEntry => ({ sys: { id, contentType: { sys: { id: 'banner' } } }, fields: {} });
const link = (id: string) => ({ sys: { type: 'Link', linkType: 'Entry', id } });

describe('referenceIds', () => {
    it('reads IDs from links and resolved entries, skipping anything without one', () => {
        expect(referenceIds([link('a'), entry('b'), null, { sys: {} }])).toEqual(['a', 'b']);
        expect(referenceIds(undefined)).toEqual([]);
    });
});

describe('orderByIds', () => {
    const [a, b, c] = [entry('a'), entry('b'), entry('c')];

    it('follows the given order', () => {
        expect(orderByIds([a, b, c], ['c', 'a', 'b'])).toEqual([c, a, b]);
    });

    it('drops removed items and skips IDs it has no content for yet', () => {
        expect(orderByIds([a, b, c], ['new', 'c', 'a'])).toEqual([c, a]);
    });

    it('matches repeated entries occurrence by occurrence', () => {
        const a2 = entry('a');
        expect(orderByIds([a, b, a2], ['b', 'a', 'a'])).toEqual([b, a, a2]);
    });
});

describe('useLiveOrder', () => {
    const items = [entry('a'), entry('b'), entry('c')];
    const owner: CfEntry = {
        sys: { id: 'page', contentType: { sys: { id: 'landingPage' } } },
        fields: { sections: items },
    };
    const wrapper = (preview: boolean) =>
        function Wrapper({ children }: { children: ReactNode }) {
            return (
                <MemoryRouter>
                    <InspectorContext.Provider value={preview}>{children}</InspectorContext.Provider>
                </MemoryRouter>
            );
        };

    beforeEach(() => {
        subscribe.mockReset().mockReturnValue(vi.fn());
    });

    it('returns the loader order and loads nothing outside preview', async () => {
        const { result } = renderHook(() => useLiveOrder(owner, 'sections', items), { wrapper: wrapper(false) });
        await Promise.resolve();
        expect(result.current).toBe(items);
        expect(subscribe).not.toHaveBeenCalled();
    });

    it('reorders as soon as the editor reorders the field', async () => {
        const { result } = renderHook(() => useLiveOrder(owner, 'sections', items), { wrapper: wrapper(true) });
        await waitFor(() => expect(subscribe).toHaveBeenCalledTimes(1));

        const [event, config] = subscribe.mock.calls[0];
        expect(event).toBe('edit');
        expect(config.data).toEqual({
            sys: { ...owner.sys, type: 'Entry' },
            fields: { sections: [link('a'), link('b'), link('c')] },
        });

        act(() => void config.callback({ ...owner, fields: { sections: [link('c'), link('a'), link('b')] } }));
        expect(result.current.map((item) => item.sys.id)).toEqual(['c', 'a', 'b']);
    });

    it('unsubscribes on unmount', async () => {
        const unsubscribe = vi.fn();
        subscribe.mockReturnValue(unsubscribe);
        const { unmount } = renderHook(() => useLiveOrder(owner, 'sections', items), { wrapper: wrapper(true) });
        await waitFor(() => expect(subscribe).toHaveBeenCalled());
        unmount();
        expect(unsubscribe).toHaveBeenCalled();
    });
});
