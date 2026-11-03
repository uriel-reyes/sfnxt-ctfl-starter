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
import { timingSafeEqual } from 'node:crypto';
import { PREVIEW_PARAM } from './inspector';

/**
 * True when the request may see drafts: it carries `?cfpreview=<CONTENTFUL_PREVIEW_SECRET>`, which is what the
 * space's content preview URLs send. Without a configured secret preview stays off, so unpublished content is never
 * served to a request that merely adds `?cfpreview`.
 */
export function isContentfulPreview(request: Request): boolean {
    const secret = process.env.CONTENTFUL_PREVIEW_SECRET;
    const given = new URL(request.url).searchParams.get(PREVIEW_PARAM);
    if (!secret || !given) return false;
    const a = Buffer.from(given);
    const b = Buffer.from(secret);
    return a.length === b.length && timingSafeEqual(a, b);
}
