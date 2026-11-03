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
import { stripStega } from './live-preview';
import type { CfEntry, DynamicCollectionFields, PersonFields } from './types';

/**
 * Blog helpers for the Demo 2.0 model, shared by loaders and components. Blog posts live in the same space as the
 * rest of a brand's content and are scoped the same way (internal-name prefix, see `brand.ts`).
 */

/** "Jane Doe" from a `person`; empty when neither name is set. */
export function personName(person: CfEntry<PersonFields> | undefined): string {
    const f = person?.fields;
    return [f?.firstName, f?.lastName]
        .map((part) => part?.trim())
        .filter(Boolean)
        .join(' ');
}

/** "A", "A and B", "A, B and C". */
export function byline(names: string[]): string {
    if (names.length < 2) return names[0] ?? '';
    return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

/**
 * `dynamicCollection.type` values (content type display names) the storefront can render, mapped to content type
 * IDs. Only types with a collection card are listed; the others are skipped.
 */
export const DYNAMIC_COLLECTION_TYPES: Record<string, string> = {
    'Blog Post': 'blogPost',
    Product: 'product',
    'Product Category': 'productCategory',
};

/** The content type IDs a dynamic collection queries, in authored order, limited to renderable types. */
export function dynamicCollectionTypes(collection: CfEntry<DynamicCollectionFields>): string[] {
    const ids = (collection.fields.type ?? []).map((name) => DYNAMIC_COLLECTION_TYPES[stripStega(name)]);
    return [...new Set(ids.filter((id): id is string => Boolean(id)))];
}

const createdAt = (entry: CfEntry) => entry.sys.createdAt ?? '';

/**
 * The items a dynamic collection shows: its pinned `include` entries first, then queried entries ordered by
 * `displayOrder` (creation date; the model has no publish-date field), without duplicates or `exclude` entries,
 * up to `limit`. Pinned entries count toward the limit.
 */
export function mergeDynamicItems(collection: CfEntry<DynamicCollectionFields>, queried: CfEntry[]): CfEntry[] {
    const f = collection.fields;
    const excluded = new Set((f.exclude ?? []).map((entry) => entry?.sys?.id));
    const oldestFirst = stripStega(f.displayOrder) === 'Oldest First';
    const ordered = [...queried].sort((a, b) =>
        oldestFirst ? createdAt(a).localeCompare(createdAt(b)) : createdAt(b).localeCompare(createdAt(a))
    );

    const seen = new Set<string>();
    const items: CfEntry[] = [];
    for (const entry of [...(f.include ?? []), ...ordered]) {
        // Pinned links that didn't resolve (drafts, deleted entries) have no fields.
        if (!entry?.fields || excluded.has(entry.sys.id) || seen.has(entry.sys.id)) continue;
        seen.add(entry.sys.id);
        items.push(entry);
    }
    const limit = typeof f.limit === 'number' && f.limit > 0 ? f.limit : (f.include?.length ?? 0);
    return items.slice(0, limit);
}
