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
import { createClient } from 'contentful';
import type { LoaderFunctionArgs } from 'react-router';
import { getConfig } from '@salesforce/storefront-next-runtime/config';
import { getLogger } from '@/lib/logger.server';

/**
 * The one way storefront code reads Contentful. Callers name a space by its key in `contentful.spaces` config
 * (never a space ID or token) and pass the query to run; this module resolves the space, picks the Delivery or
 * Preview API, time-boxes the call, and caches published results briefly per instance.
 *
 * Tokens are server-only env vars named after the space key, e.g. `brand` → `CONTENTFUL_BRAND_DELIVERY_TOKEN`
 * and `CONTENTFUL_BRAND_PREVIEW_TOKEN`.
 */
export type ContentfulClient = ReturnType<typeof createClient>;

export type ContentfulQuery = {
    /** Key in `contentful.spaces` config, e.g. `'brand'`. */
    space: string;
    /** Names this result within the space for the published-content cache, e.g. `'page:rawlings:home'`. */
    cacheKey: string;
    /** Read drafts from the Preview API (uncached, with Content Source Maps). Ignored without a preview token. */
    preview?: boolean;
    timeoutMs?: number;
};

/** Short per-instance cache for published content; CONTENTFUL_PAGE_CACHE_TTL_MS=0 disables it. */
const CACHE_TTL_MS = Number(process.env.CONTENTFUL_PAGE_CACHE_TTL_MS ?? 60_000);
const TIMEOUT_MS = 4000;
// Preview is uncached and only seen by editors, so it can wait longer.
const PREVIEW_TIMEOUT_MS = 8000;

const cache = new Map<string, { value: unknown; expiresAt: number }>();
const inflight = new Map<string, Promise<unknown>>();
const clients = new Map<string, ContentfulClient>();

/** `brand` → `CONTENTFUL_BRAND`; `brand-us` → `CONTENTFUL_BRAND_US`. */
const envPrefix = (space: string) => `CONTENTFUL_${space.replace(/[^a-z0-9]+/gi, '_').toUpperCase()}`;

export function spaceTokens(space: string): { delivery?: string; preview?: string } {
    const prefix = envPrefix(space);
    return {
        delivery: process.env[`${prefix}_DELIVERY_TOKEN`] || undefined,
        preview: process.env[`${prefix}_PREVIEW_TOKEN`] || undefined,
    };
}

function clientFor(spaceId: string, environment: string, accessToken: string, preview: boolean): ContentfulClient {
    const key = `${spaceId}:${environment}:${preview ? 'preview' : 'delivery'}`;
    let client = clients.get(key);
    if (!client) {
        client = createClient({
            space: spaceId,
            environment,
            accessToken,
            ...(preview && { host: 'preview.contentful.com', includeContentSourceMaps: true }),
        });
        clients.set(key, client);
    }
    return client;
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`Contentful ${label} timed out after ${ms}ms`)), ms);
    });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/**
 * Run `load` against the named space. Resolves to null when the space is not configured (no config entry or no
 * token). Rejects when Contentful fails or is too slow; the failure is logged and never cached.
 */
export async function queryContentful<T>(
    args: Pick<LoaderFunctionArgs, 'context'>,
    { space, cacheKey, preview = false, timeoutMs = TIMEOUT_MS }: ContentfulQuery,
    load: (client: ContentfulClient) => Promise<T>
): Promise<T | null> {
    const config = getConfig(args.context).contentful?.spaces?.[space];
    const tokens = spaceTokens(space);
    const usePreview = preview && !!tokens.preview;
    const accessToken = usePreview ? tokens.preview : tokens.delivery;
    if (!config?.spaceId || !accessToken) return null;

    const environment = config.environment || 'master';
    const client = clientFor(config.spaceId, environment, accessToken, usePreview);
    const label = `${space}:${cacheKey}`;

    try {
        if (usePreview) return await withTimeout(load(client), PREVIEW_TIMEOUT_MS, label);

        const key = `${config.spaceId}:${environment}:${cacheKey}`;
        const hit = cache.get(key);
        if (CACHE_TTL_MS > 0 && hit && hit.expiresAt > Date.now()) return hit.value as T;

        let pending = inflight.get(key) as Promise<T> | undefined;
        if (!pending) {
            pending = load(client)
                .then((value) => {
                    if (CACHE_TTL_MS > 0) cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
                    return value;
                })
                .finally(() => inflight.delete(key));
            inflight.set(key, pending);
        }
        return await withTimeout(pending, timeoutMs, label);
    } catch (error) {
        getLogger(args.context).warn('Contentful query failed', { space, cacheKey, preview: usePreview, error });
        throw error;
    }
}

/** Test hook: forget cached results and clients between tests. */
export function resetContentfulCache(): void {
    cache.clear();
    inflight.clear();
    clients.clear();
}
