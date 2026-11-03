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
import { useEffect } from 'react';
import { ContentfulLivePreview } from '@contentful/live-preview';

/**
 * Connects the page to the Contentful editor with inspector mode only. Live updates stay off: with them on, the
 * editor's merged entry graph and the re-fetched loader data are two sources of truth, and a reorder can leave the
 * page out of step with the editor. With them off, the editor reloads the preview after each save, so the page is
 * always the server render of the latest draft.
 */
export default function LivePreviewRuntime() {
    useEffect(() => {
        void ContentfulLivePreview.init({ locale: 'en-US', enableInspectorMode: true, enableLiveUpdates: false });
    }, []);
    return null;
}
