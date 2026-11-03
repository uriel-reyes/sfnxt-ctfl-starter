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
import { data, type LoaderFunctionArgs } from 'react-router';
import { getAppOrigin } from '@/lib/origin';
import { buildCanonicalUrl } from '@/utils/canonical-url';
import { type ContentRequest, contentRequest } from './content.server';

type Args = Pick<LoaderFunctionArgs, 'context' | 'request'>;

export function notFound(): never {
    // oxlint-disable-next-line @typescript-eslint/only-throw-error -- React Router renders thrown data responses in the ErrorBoundary
    throw data('Not found', { status: 404 });
}

/** The brand and preview state for a page loader; 404 for sites that are not configured as brands. */
export function requireContentRequest(args: Args): ContentRequest {
    return contentRequest(args) ?? notFound();
}

/** Absolute canonical URL for the request (tracking and preview parameters dropped). */
export function canonicalUrl(args: Args): string {
    const url = new URL(args.request.url);
    return buildCanonicalUrl(getAppOrigin(args.context), url.pathname);
}
