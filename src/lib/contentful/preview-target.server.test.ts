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

const brands = {
    rawlings: { space: 'brand', tag: 'rawlings', name: 'Rawlings', homeSlug: 'home-rawlings' },
    easton: { space: 'brand', tag: 'easton', name: 'Easton', homeSlug: 'home-easton' },
};

vi.mock('@salesforce/storefront-next-runtime/config', () => ({
    getConfig: () => ({ contentful: { brands } }),
}));

const entry = (id: string, contentType: string, fields: Record<string, unknown>, linkedFrom: string[] = []) => ({
    sys: { id, contentType: { sys: { id: contentType } } },
    fields,
    linkedFrom,
});

let graph: ReturnType<typeof entry>[] = [];

const fakeClient = {
    getEntries: (query: Record<string, string>) =>
        Promise.resolve({
            items: query['sys.id']
                ? graph.filter((e) => e.sys.id === query['sys.id'])
                : graph.filter((e) =>
                      graph.find((child) => child.sys.id === query.links_to_entry)?.linkedFrom.includes(e.sys.id)
                  ),
        }),
};

vi.mock('./client.server', () => ({
    queryContentful: (_args: unknown, _query: unknown, load: (client: unknown) => Promise<unknown>) => load(fakeClient),
}));

const { resolvePreviewTarget } = await import('./preview-target.server');

const rawlings = { ...brands.rawlings, siteId: 'rawlings' };
const req = { brand: rawlings, preview: true, space: 'brand' };
const args = {} as never;

describe('resolvePreviewTarget', () => {
    beforeEach(() => {
        graph = [
            entry('home-e', 'landingPage', { slug: 'home-easton', internalName: 'Easton - Home' }),
            entry('shop-e', 'landingPage', { slug: 'shop-easton', internalName: 'Easton - Page - Shop' }),
            entry('section', 'cards', { internalName: 'Easton - Cards' }, ['shop-e']),
            entry('card', 'card', { internalName: 'Easton - Card' }, ['section']),
            entry('glove', 'product', { slug: 'rev1x', internalName: 'Rawlings - Product - Rev1X' }),
            entry('nav', 'navigation', { internalName: 'Easton - Navigation 1' }),
            entry('post', 'blogPost', { slug: 'swing-tips', internalName: 'Easton - Blog 1' }),
            entry('quote', 'quote', { internalName: 'Easton - Quote' }, ['post']),
            entry('blog', 'dynamicListingPage', {
                slug: 'stories-easton',
                listingType: 'blogPost',
                internalName: 'Easton - Blog Listing',
            }),
            entry('events', 'dynamicListingPage', {
                slug: 'events',
                listingType: 'event',
                internalName: 'Easton - Events',
            }),
        ];
    });

    it('sends a page to itself on the brand it was authored for', async () => {
        await expect(resolvePreviewTarget(args, req, 'shop-e')).resolves.toMatchObject({
            brand: { siteId: 'easton' },
            path: '/shop',
        });
        await expect(resolvePreviewTarget(args, req, 'home-e')).resolves.toMatchObject({ path: '/' });
        await expect(resolvePreviewTarget(args, req, 'glove')).resolves.toMatchObject({
            brand: { siteId: 'rawlings' },
            path: '/products/rev1x',
        });
    });

    it('sends a nested entry to the nearest page that links to it', async () => {
        await expect(resolvePreviewTarget(args, req, 'card')).resolves.toMatchObject({
            brand: { siteId: 'easton' },
            path: '/shop',
        });
    });

    it('sends blog posts, their embeds and the blog listing page to the blog', async () => {
        await expect(resolvePreviewTarget(args, req, 'post')).resolves.toMatchObject({
            brand: { siteId: 'easton' },
            path: '/blog/swing-tips',
        });
        await expect(resolvePreviewTarget(args, req, 'quote')).resolves.toMatchObject({ path: '/blog/swing-tips' });
        await expect(resolvePreviewTarget(args, req, 'blog')).resolves.toMatchObject({ path: '/blog' });
    });

    it('does not treat listings without a route as pages', async () => {
        await expect(resolvePreviewTarget(args, req, 'events')).resolves.toMatchObject({
            brand: { siteId: 'easton' },
            path: '/',
        });
    });

    it("falls back to the entry brand's home when no page links to it", async () => {
        await expect(resolvePreviewTarget(args, req, 'nav')).resolves.toMatchObject({
            brand: { siteId: 'easton' },
            path: '/',
        });
    });

    it("falls back to the request brand's home for unknown entries", async () => {
        await expect(resolvePreviewTarget(args, req, 'missing')).resolves.toEqual({ brand: rawlings, path: '/' });
    });
});
