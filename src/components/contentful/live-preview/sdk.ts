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
import type { ContentfulLivePreview } from '@contentful/live-preview';

export const LIVE_PREVIEW_LOCALE = 'en-US';

type Sdk = typeof ContentfulLivePreview;

let sdk: Promise<Sdk | null> | undefined;

/**
 * The Live Preview SDK, downloaded and initialized once per page. Every caller shares this instance so subscriptions
 * never race `init()`. Resolves to null when the SDK can't connect (e.g. framed by something other than the editor).
 * Outside the editor iframe `init()` leaves live updates off and `subscribe()` returns a no-op.
 */
export function livePreviewSdk(): Promise<Sdk | null> {
    sdk ??= import('@contentful/live-preview').then(({ ContentfulLivePreview: preview }) => {
        try {
            void preview.init({ locale: LIVE_PREVIEW_LOCALE, enableInspectorMode: true, enableLiveUpdates: true });
            return preview;
        } catch {
            return null;
        }
    });
    return sdk;
}
