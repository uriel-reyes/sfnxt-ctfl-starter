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
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

describe('routes.ts', () => {
    let originalReactRouterAppDirectory: string;

    beforeEach(() => {
        originalReactRouterAppDirectory = globalThis.__reactRouterAppDirectory;
        globalThis.__reactRouterAppDirectory = __dirname;
    });

    afterEach(() => {
        globalThis.__reactRouterAppDirectory = originalReactRouterAppDirectory;
    });

    it('should export the routes object', async () => {
        const { default: routes } = await import('./routes');
        const resolvedRoutes = await routes;

        // With site context URL prefix configured, routes are wrapped under a site-context-wrapper
        const wrapper = resolvedRoutes.find((r: any) => r.id === 'site-context-wrapper');
        expect(wrapper).toBeDefined();
        expect(wrapper?.children).toBeDefined();

        const wrappedRoutes = wrapper?.children ?? [];

        // Find the `_app` layout route (pathless layout) inside the wrapper
        const defaultLayout = wrappedRoutes.find((r: any) => r.id === 'routes/_app');
        expect(defaultLayout).toBeDefined();
        expect(defaultLayout?.file).toBe('routes/_app.tsx');
        expect(defaultLayout?.children).toBeDefined();

        // Check the Contentful-backed child routes nested under the `_app` layout
        expect(defaultLayout?.children).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    id: 'routes/_app._index',
                    index: true,
                    path: undefined,
                }),
                expect.objectContaining({
                    id: 'routes/_app.$slug',
                    path: ':slug',
                }),
                expect.objectContaining({
                    id: 'routes/_app.shop.$slug',
                    path: 'shop/:slug',
                }),
                expect.objectContaining({
                    id: 'routes/_app.products.$slug',
                    path: 'products/:slug',
                }),
                expect.objectContaining({
                    id: 'routes/_app.cart',
                    path: 'cart',
                }),
            ])
        );

        // Salesforce Commerce routes stay in the repo but are not registered
        const childIds = (defaultLayout?.children ?? []).map((route: any) => route.id);
        for (const id of ['routes/_app.c.$', 'routes/_app.p.$', 'routes/_app.cms.$', 'routes/_app.search']) {
            expect(childIds).not.toContain(id);
        }
        expect(wrappedRoutes.find((r: any) => r.id === 'routes/_checkout')?.children ?? []).toEqual([]);
        expect(
            (wrappedRoutes.find((r: any) => r.id === 'routes/_empty')?.children ?? []).map((route: any) => route.id)
        ).not.toContain('routes/_empty.login');

        // Verify root index route is duplicated at the top level for homepage access at '/'
        const rootDuplicate = resolvedRoutes.find((r: any) => r.id === 'routes/_app--root-duplicate');
        expect(rootDuplicate).toBeDefined();
    });
});
