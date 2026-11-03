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

/**
 * Under preview the Content Preview API stega-encodes text fields (Content Source Maps) with invisible Unicode so
 * the Live Preview inspector can tag rendered text. Anything that treats such a value as an identifier, key, URL or
 * metadata must strip the encoding first. Published content is never encoded, so these are no-ops outside preview.
 */
const STEGA_RUN = /(?:[\u200b\u200c\u2060\u2061\u2062\u2063\ufeff\u{1d153}-\u{1d15a}]|\u200d){4,}/gu;

/** Removes Content Source Maps stega encoding from a string. */
export function stripStega<T extends string | null | undefined>(value: T): T {
    return (typeof value === 'string' ? value.replace(STEGA_RUN, '') : value) as T;
}

/**
 * Strips stega from a mapped Ninetailed experience's correlation IDs. The SDK selects variants (and the preview
 * drawer filters experiences) by comparing these IDs, so an encoded ID silently never matches.
 */
export function normalizeExperienceIds<T extends { id: string; audience?: { id: string } | null }>(experience: T): T {
    const audience = experience.audience;
    return {
        ...experience,
        id: stripStega(experience.id),
        ...(audience ? { audience: { ...audience, id: stripStega(audience.id) } } : {}),
    };
}

function linkStub(node: Record<string, unknown>): unknown {
    const sys = node.sys as { id?: string; type?: string; linkType?: string } | undefined;
    if (!sys?.id) return undefined;
    return { sys: { type: 'Link', linkType: sys.linkType ?? sys.type ?? 'Entry', id: sys.id } };
}

/**
 * Structural clone of a Contentful entry graph with only genuine cycles cut. The SDK's link resolution produces
 * cycles (collection → product → category → …); Ninetailed's preview channel serializes entries with
 * `JSON.stringify` and throws on them. Back-edges become Link stubs; shared acyclic references are kept by value.
 */
export function breakCycles<T>(value: T, ancestors: Set<object> = new Set()): T {
    if (value === null || typeof value !== 'object') return value;
    if (ancestors.has(value as object)) return linkStub(value as Record<string, unknown>) as T;

    ancestors.add(value as object);
    let result: unknown;
    if (Array.isArray(value)) {
        result = value.map((item) => breakCycles(item, ancestors));
    } else {
        const out: Record<string, unknown> = {};
        for (const key of Object.keys(value as Record<string, unknown>)) {
            out[key] = breakCycles((value as Record<string, unknown>)[key], ancestors);
        }
        result = out;
    }
    ancestors.delete(value as object);
    return result as T;
}
