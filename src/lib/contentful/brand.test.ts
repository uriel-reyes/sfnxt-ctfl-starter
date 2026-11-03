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
import { belongsToBrand, brandFor, candidateSlugs, urlSlug } from './brand';
import { breakCycles, stripStega } from './live-preview';
import { hrefForEntry } from './links';
import type { CfEntry } from './types';

const brands = {
    rawlings: { space: 'brand', tag: 'rawlings', name: 'Rawlings', homeSlug: 'home-rawlings' },
    easton: { space: 'brand', tag: 'easton', name: 'Easton', homeSlug: 'home-easton' },
};
const rawlings = { ...brands.rawlings, siteId: 'rawlings' };

it('resolves a brand by site id', () => {
    expect(brandFor(brands, 'rawlings')).toEqual(rawlings);
    expect(brandFor(brands, 'unknown')).toBeNull();
});

const entry = (contentType: string, fields: Record<string, unknown>): CfEntry =>
    ({ sys: { id: 'x', type: 'Entry', contentType: { sys: { id: contentType } } }, fields }) as unknown as CfEntry;

const STEGA = '\u200b\u200c\u200d\ufeff\u200b\u200c';

describe('brand scoping', () => {
    it('matches entries by internal-name prefix, ignoring case and stega', () => {
        expect(belongsToBrand(entry('banner', { internalName: 'Rawlings - Hero' }), rawlings)).toBe(true);
        expect(belongsToBrand(entry('banner', { internalName: `rawlings - Hero${STEGA}` }), rawlings)).toBe(true);
        expect(belongsToBrand(entry('banner', { internalName: 'Easton - Hero' }), rawlings)).toBe(false);
        expect(belongsToBrand(entry('banner', {}), rawlings)).toBe(false);
    });

    it('scopes to an alternate content set by contentName', () => {
        const alternate = { ...rawlings, tag: 'rawlings2', contentName: 'Rawlings2' };
        expect(belongsToBrand(entry('banner', { internalName: 'Rawlings2 - Hero' }), alternate)).toBe(true);
        expect(belongsToBrand(entry('banner', { internalName: 'Rawlings - Hero' }), alternate)).toBe(false);
        expect(belongsToBrand(entry('banner', { internalName: 'Rawlings2 - Hero' }), rawlings)).toBe(false);
        expect(urlSlug('gloves-rawlings2', alternate)).toBe('gloves');
    });

    it('drops the brand slug suffix in URLs and restores it when resolving', () => {
        expect(urlSlug('shop-rawlings', rawlings)).toBe('shop');
        expect(urlSlug('gloves', rawlings)).toBe('gloves');
        expect(urlSlug('-rawlings', rawlings)).toBe('-rawlings');
        expect(candidateSlugs('shop', rawlings)).toEqual(['shop-rawlings', 'shop']);
    });

    it('links the home landing page to the site root and other entries to their routes', () => {
        expect(hrefForEntry(entry('landingPage', { slug: 'home-rawlings' }), rawlings)).toBe('/');
        expect(hrefForEntry(entry('landingPage', { slug: 'shop-rawlings' }), rawlings)).toBe('/shop');
        expect(hrefForEntry(entry('product', { slug: 'rev1x' }), rawlings)).toBe('/products/rev1x');
        expect(hrefForEntry(entry('productCategory', { slug: 'gloves' }), rawlings)).toBe('/shop/gloves');
    });
});

describe('live preview helpers', () => {
    it('strips stega runs but keeps ordinary text', () => {
        expect(stripStega(`Gloves${STEGA}`)).toBe('Gloves');
        expect(stripStega('Gloves')).toBe('Gloves');
        expect(stripStega(undefined)).toBeUndefined();
    });

    it('replaces back-references with link stubs so the graph serializes', () => {
        const parent: Record<string, unknown> = { sys: { id: 'p', type: 'Entry' }, fields: {} };
        (parent.fields as Record<string, unknown>).self = parent;
        const result = breakCycles(parent) as { fields: { self: unknown } };
        expect(result.fields.self).toEqual({ sys: { type: 'Link', linkType: 'Entry', id: 'p' } });
        expect(() => JSON.stringify(result)).not.toThrow();
    });
});
