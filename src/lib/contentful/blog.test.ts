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
import { describe, expect, it } from 'vitest';
import { byline, dynamicCollectionTypes, mergeDynamicItems, personName } from './blog';
import type { CfEntry, DynamicCollectionFields } from './types';

const entry = (id: string, contentType: string, fields: Record<string, unknown> = {}, createdAt?: string): CfEntry =>
    ({ sys: { id, createdAt, contentType: { sys: { id: contentType } } }, fields }) as CfEntry;

const collection = (fields: DynamicCollectionFields) =>
    entry('dc', 'dynamicCollection', fields) as CfEntry<DynamicCollectionFields>;

describe('authors', () => {
    it('names a person from first and last name', () => {
        expect(personName(entry('p', 'person', { firstName: ' Jane ', lastName: 'Doe' }))).toBe('Jane Doe');
        expect(personName(entry('p', 'person', { firstName: 'Jane' }))).toBe('Jane');
        expect(personName(entry('p', 'person', { internalName: 'Brand - Author' }))).toBe('');
        expect(personName(undefined)).toBe('');
    });

    it('joins names into a byline', () => {
        expect(byline([])).toBe('');
        expect(byline(['A'])).toBe('A');
        expect(byline(['A', 'B'])).toBe('A and B');
        expect(byline(['A', 'B', 'C'])).toBe('A, B and C');
    });
});

describe('dynamic collections', () => {
    it('maps renderable type names to content type ids and skips the rest', () => {
        expect(dynamicCollectionTypes(collection({ type: ['Blog Post', 'Event', 'Product', 'Blog Post'] }))).toEqual([
            'blogPost',
            'product',
        ]);
        expect(dynamicCollectionTypes(collection({}))).toEqual([]);
    });

    const posts = [
        entry('old', 'blogPost', { slug: 'old' }, '2024-01-01T00:00:00Z'),
        entry('new', 'blogPost', { slug: 'new' }, '2026-01-01T00:00:00Z'),
        entry('mid', 'blogPost', { slug: 'mid' }, '2025-01-01T00:00:00Z'),
    ];
    const ids = (items: CfEntry[]) => items.map((item) => item.sys.id);

    it('orders queried entries by creation date and applies the limit', () => {
        expect(ids(mergeDynamicItems(collection({ limit: 2, displayOrder: 'Newest First' }), posts))).toEqual([
            'new',
            'mid',
        ]);
        expect(ids(mergeDynamicItems(collection({ limit: 5, displayOrder: 'Oldest First' }), posts))).toEqual([
            'old',
            'mid',
            'new',
        ]);
    });

    it('pins included entries first, drops excluded and unresolved ones, and never repeats an entry', () => {
        const pinned = posts[0];
        const unresolved = { sys: { id: 'gone' } } as CfEntry;
        const result = mergeDynamicItems(
            collection({ limit: 3, include: [unresolved, pinned], exclude: [posts[1]] }),
            posts
        );
        expect(ids(result)).toEqual(['old', 'mid']);
    });

    it('shows only pinned entries when the limit is 0', () => {
        expect(ids(mergeDynamicItems(collection({ limit: 0, include: [posts[2]] }), posts))).toEqual(['mid']);
    });
});
