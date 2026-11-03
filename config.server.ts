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

import { defineConfig, defaultSecurityHeaders } from '@salesforce/storefront-next-runtime/config';
import { defaultCspDirectives } from '@salesforce/storefront-next-runtime/security';
import baseConfig, { protectedConfigPaths } from './config.server.base';

const brandSite = (id: string) => ({
    id,
    defaultLocale: 'en-US',
    defaultCurrency: 'USD',
    supportedLocales: [{ id: 'en-US', preferredCurrency: 'USD' }],
    supportedCurrencies: ['USD'],
});

const CONTENTFUL_ORIGINS = ['https://cdn.contentful.com', 'https://preview.contentful.com'];
const PERSONALIZATION_ORIGINS = ['https://experience.ninetailed.co', 'https://ingest.insights.ninetailed.co'];
const PERSONALIZATION_PREVIEW_ORIGIN = 'https://preview.widgets.ninetailed.io';

export default defineConfig(
    {
        ...baseConfig,
        app: {
            ...baseConfig?.app,
            commerce: {
                ...baseConfig?.app?.commerce,
                // Each brand is a storefront site whose content is selected by a Contentful tag (see `contentful.brands`).
                sites: [brandSite('rawlings'), brandSite('easton')],
                sitesFromDal: false,
            },
            defaultSiteId: 'rawlings',
            siteAliasMap: { rawlings: 'rawlings', easton: 'easton' },
            links: {
                ...baseConfig?.app?.links,
                preconnect: ['https://images.ctfassets.net'],
            },
            security: {
                ...baseConfig?.app?.security,
                headers: {
                    ...defaultSecurityHeaders,
                    // Contentful Live Preview frames the storefront from app.contentful.com. frame-ancestors governs
                    // framing; X-Frame-Options can't express an allow-list, so it is turned off.
                    frameOptions: false as const,
                    csp: {
                        directives: {
                            ...defaultCspDirectives,
                            'frame-ancestors': [
                                "'self'",
                                'https://app.contentful.com',
                                'https://app.eu.contentful.com',
                            ],
                            'script-src': [
                                ...(defaultCspDirectives['script-src'] ?? []),
                                PERSONALIZATION_PREVIEW_ORIGIN,
                            ],
                            'connect-src': [
                                ...(defaultCspDirectives['connect-src'] ?? []),
                                ...CONTENTFUL_ORIGINS,
                                ...PERSONALIZATION_ORIGINS,
                                PERSONALIZATION_PREVIEW_ORIGIN,
                                'https://app.contentful.com',
                            ],
                            'img-src': [
                                ...(defaultCspDirectives['img-src'] ?? []),
                                'https://images.ctfassets.net',
                                'https://cdn.shopify.com',
                            ],
                            'media-src': [
                                ...(defaultCspDirectives['media-src'] ?? ["'self'"]),
                                'https://videos.ctfassets.net',
                            ],
                            'frame-src': [...(defaultCspDirectives['frame-src'] ?? []), PERSONALIZATION_PREVIEW_ORIGIN],
                        },
                        reportOnly: false,
                    },
                },
            },
        },
    },
    { protectedPaths: protectedConfigPaths }
);
