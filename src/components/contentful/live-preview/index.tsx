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
import { lazy, type ReactNode, Suspense, useLayoutEffect } from 'react';
import { useConfig } from '@salesforce/storefront-next-runtime/config';
import { useBrand } from '@/lib/contentful/brand';
import { InspectorContext } from '@/lib/contentful/inspector';
import { livePreviewSdk } from './sdk';

const LivePreviewRuntime = lazy(() => import('./runtime'));

/**
 * Turns on Contentful Live Preview below it when `enabled` (a validated `?cfpreview` request): inspector tags on
 * the server-rendered page, plus the SDK, which is only downloaded in preview so published traffic never pays for it.
 */
export function LivePreviewProvider({ enabled, children }: { enabled: boolean; children: ReactNode }) {
    if (!enabled) return <>{children}</>;
    return (
        <InspectorContext.Provider value>
            <LivePreviewInit />
            {children}
            <Suspense fallback={null}>
                <LivePreviewRuntime />
            </Suspense>
        </InspectorContext.Provider>
    );
}

/**
 * Initializes the SDK with the brand's space and environment, which manually tagged elements report when clicked.
 * Layout effects run before every passive effect in the tree, so this beats the live-update hooks to `init()`.
 */
function LivePreviewInit() {
    const config = useConfig();
    const brand = useBrand();
    const space = config.contentful?.spaces?.[brand?.space ?? 'brand'];
    useLayoutEffect(() => {
        void livePreviewSdk({ space: space?.spaceId, environment: space?.environment || 'master' });
    }, [space?.spaceId, space?.environment]);
    return null;
}
