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
import { beforeEach, describe, expect, it, vi } from 'vitest';

type FakeEntry = {
    sys: { id: string; createdAt?: string; contentType: { sys: { id: string } } };
    fields: Record<string, unknown>;
};

const entry = (id: string, contentType: string, fields: Record<string, unknown>, createdAt?: string): FakeEntry => ({
    sys: { id, createdAt, contentType: { sys: { id: contentType } } },
    fields,
});

let entries: FakeEntry[] = [];
let failTypes = new Set<string>();

/** Filters by content type and the exact-match fields the reads use; ignores full-text and ordering. */
const fakeClient = {
    withoutUnresolvableLinks: {
        getEntries: (query: Record<string, string>) => {
            if (failTypes.has(query.content_type)) return Promise.reject(new Error('boom'));
            const items = entries.filter(
                (e) =>
                    e.sys.contentType.sys.id === query.content_type &&
                    (!query['fields.listingType'] || e.fields.listingType === query['fields.listingType']) &&
                    (!query['fields.slug[in]'] || query['fields.slug[in]'].split(',').includes(e.fields.slug as string))
            );
            return Promise.resolve({ items });
        },
    },
};

vi.mock('./client.server', () => ({
    queryContentful: (_args: unknown, _query: unknown, load: (client: unknown) => Promise<unknown>) => load(fakeClient),
}));

const { getBlogListingPage, getBlogPost, getBlogPosts, resolveDynamicCollections } = await import('./content.server');

const easton = { space: 'brand', tag: 'easton', name: 'Easton', homeSlug: 'home-easton', siteId: 'easton' };
const req = { brand: easton, preview: false, space: 'brand' };
const args = {} as never;

describe('blog reads', () => {
    beforeEach(() => {
        failTypes = new Set();
        entries = [
            entry('e1', 'blogPost', { internalName: 'Easton - Blog 1', slug: 'swing-tips-easton' }, '2025-01-01'),
            entry('e2', 'blogPost', { internalName: 'Easton - Blog 2', slug: 'bat-care' }, '2026-01-01'),
            entry('r1', 'blogPost', { internalName: 'Rawlings - Blog 1', slug: 'glove-care' }, '2026-02-01'),
            entry('l-r', 'dynamicListingPage', { internalName: 'Rawlings - Blog', listingType: 'blogPost' }),
            entry('l-ev', 'dynamicListingPage', { internalName: 'Easton - Events', listingType: 'event' }),
            entry('l-e', 'dynamicListingPage', { internalName: 'Easton - Stories', listingType: 'blogPost' }),
            entry('p1', 'product', { internalName: 'Easton - Bat' }, '2024-06-01'),
        ];
    });

    it("lists only the brand's posts and resolves a post by URL segment", async () => {
        expect((await getBlogPosts(args, req)).map((p) => p.sys.id).sort()).toEqual(['e1', 'e2']);
        expect((await getBlogPost(args, req, 'swing-tips'))?.sys.id).toBe('e1');
        expect(await getBlogPost(args, req, 'glove-care')).toBeNull();
    });

    it("finds the brand's blog listing page whatever its slug", async () => {
        expect((await getBlogListingPage(args, req))?.sys.id).toBe('l-e');
    });

    it('fills dynamic collections from the brand entries without touching the fetched page', async () => {
        const dynamic = entry('dc', 'dynamicCollection', {
            type: ['Blog Post', 'Product', 'Event'],
            limit: 2,
            displayOrder: 'Newest First',
        });
        const banner = entry('b', 'banner', {});
        const page = entry('page', 'landingPage', { sections: [banner, dynamic] });

        const resolved = await resolveDynamicCollections(args, req, page as never, 'sections');
        const sections = resolved.fields.sections as FakeEntry[];
        expect(sections[0]).toBe(banner);
        expect((sections[1].fields.items as FakeEntry[]).map((item) => item.sys.id)).toEqual(['e2', 'e1']);
        expect(dynamic.fields.items).toBeUndefined();
    });

    it('returns pages without dynamic collections as-is, and keeps pinned items when a query fails', async () => {
        const plain = entry('page', 'landingPage', { sections: [entry('b', 'banner', {})] });
        expect(await resolveDynamicCollections(args, req, plain as never, 'sections')).toBe(plain);

        failTypes = new Set(['blogPost']);
        const pinned = entries[0];
        const dynamic = entry('dc', 'dynamicCollection', { type: ['Blog Post'], limit: 3, include: [pinned] });
        const page = entry('page', 'landingPage', { sections: [dynamic] });
        const resolved = await resolveDynamicCollections(args, req, page as never, 'sections');
        const items = (resolved.fields.sections as FakeEntry[])[0].fields.items as FakeEntry[];
        expect(items.map((item) => item.sys.id)).toEqual(['e1']);
    });
});
