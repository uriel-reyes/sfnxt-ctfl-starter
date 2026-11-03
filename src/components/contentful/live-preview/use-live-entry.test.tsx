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
import { isNewer, useLiveEntry } from './use-live-entry';

const subscribe = vi.fn();
vi.mock('./sdk', () => ({
    LIVE_PREVIEW_LOCALE: 'en-US',
    livePreviewSdk: () => Promise.resolve({ subscribe }),
}));

type Banner = { sys: { id: string; updatedAt?: string }; fields: { heading: string } };
const banner = (heading: string, updatedAt = '2026-11-02T10:00:00Z'): Banner => ({
    sys: { id: 'banner', updatedAt },
    fields: { heading },
});

const wrapper = (preview: boolean) =>
    function Wrapper({ children }: { children: ReactNode }) {
        return (
            <MemoryRouter>
                <InspectorContext.Provider value={preview}>{children}</InspectorContext.Provider>
            </MemoryRouter>
        );
    };

/** The callback of the most recent `subscribe('edit')` call. */
const editorCallback = () => subscribe.mock.calls.at(-1)?.[1].callback as (data: unknown) => void;

describe('isNewer', () => {
    it('compares save times, treating unknown ones as newer', () => {
        expect(isNewer(banner('a', '2026-11-02T10:00:01Z'), banner('b'))).toBe(true);
        expect(isNewer(banner('a'), banner('b'))).toBe(false);
        expect(isNewer({ sys: { id: 'x' } }, banner('b'))).toBe(true);
    });
});

describe('useLiveEntry', () => {
    beforeEach(() => {
        subscribe.mockReset().mockReturnValue(vi.fn());
    });

    it('returns the loader entry and loads nothing outside preview', async () => {
        const entry = banner('Loaded');
        const { result } = renderHook(() => useLiveEntry(entry), { wrapper: wrapper(false) });
        await Promise.resolve();
        expect(result.current).toBe(entry);
        expect(subscribe).not.toHaveBeenCalled();
    });

    it('subscribes to edits of the entry and renders them as they arrive', async () => {
        const entry = banner('Loaded');
        const { result } = renderHook(() => useLiveEntry(entry), { wrapper: wrapper(true) });
        await waitFor(() => expect(subscribe).toHaveBeenCalledTimes(1));
        expect(subscribe.mock.calls[0][0]).toBe('edit');
        expect(subscribe.mock.calls[0][1].data).toBe(entry);

        act(() => editorCallback()(banner('Typed')));
        expect(result.current.fields.heading).toBe('Typed');
    });

    it('keeps a live edit when the save reload returns data that is not newer', async () => {
        const { result, rerender } = renderHook(({ entry }) => useLiveEntry(entry), {
            wrapper: wrapper(true),
            initialProps: { entry: banner('Loaded') },
        });
        await waitFor(() => expect(subscribe).toHaveBeenCalled());
        act(() => editorCallback()(banner('Typed')));

        rerender({ entry: banner('Loaded') });
        expect(result.current.fields.heading).toBe('Typed');
        // The editor is handed the live copy to merge further changes into.
        await waitFor(() => expect(subscribe.mock.calls.at(-1)?.[1].data.fields.heading).toBe('Typed'));
    });

    it('switches to the loader entry once the save reaches the Preview API', async () => {
        const { result, rerender } = renderHook(({ entry }) => useLiveEntry(entry), {
            wrapper: wrapper(true),
            initialProps: { entry: banner('Loaded') },
        });
        await waitFor(() => expect(subscribe).toHaveBeenCalled());
        act(() => editorCallback()(banner('Typed')));

        const saved = banner('Typed (saved)', '2026-11-02T10:00:05Z');
        rerender({ entry: saved });
        expect(result.current).toBe(saved);
    });
});
