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
import { data, Outlet, type ShouldRevalidateFunctionArgs } from 'react-router';
import type { Route } from './+types/_app';
import { usePageUIConfig, mainPaddingDataAttributes } from '@/lib/routes/page-ui-config';
import { getLogger } from '@/lib/logger.server';
import { SkipLink } from '@/components/skip-link';
import { BrandTabs } from '@/components/contentful/layout/brand-tabs';
import { SiteFooter } from '@/components/contentful/layout/site-footer';
import { SiteHeader } from '@/components/contentful/layout/site-header';
import { LivePreviewProvider } from '@/components/contentful/live-preview';
import { PersonalizationProvider } from '@/components/personalization/personalization-provider';
import {
    contentRequest,
    getBrandTabs,
    getNavigation,
    getPersonalizationPreviewData,
} from '@/lib/contentful/content.server';
import { PREVIEW_PARAM } from '@/lib/contentful/inspector';
import type { BrandTab, CfEntry, NavigationFields, PersonalizationPreviewData } from '@/lib/contentful/types';

/**
 * Brand chrome only changes with the site, and a brand switch is a full document load, so client navigations keep
 * the layout data. Under Contentful preview it revalidates so edited navigation shows up.
 */
export function shouldRevalidate({ nextUrl, defaultShouldRevalidate }: ShouldRevalidateFunctionArgs) {
    return nextUrl.searchParams.has(PREVIEW_PARAM) ? defaultShouldRevalidate : false;
}

type LoaderData = {
    siteId: string;
    preview: boolean;
    navigation: CfEntry<NavigationFields>[];
    tabs: BrandTab[];
    personalizationPreview: PersonalizationPreviewData | null;
};

export async function loader(args: Route.LoaderArgs): Promise<LoaderData> {
    const req = contentRequest(args);
    // oxlint-disable-next-line @typescript-eslint/only-throw-error
    if (!req) throw data('Unknown brand', { status: 404 });

    const logger = getLogger(args.context);
    const recover =
        <T,>(what: string, fallback: T) =>
        (error: unknown) => {
            logger.error(`AppLayout: ${what} failed`, { error, brand: req.brand.siteId });
            return fallback;
        };

    // The header is above the fold, so navigation and brand tabs are awaited; the preview widget data is only
    // fetched where the widget renders (development and Contentful preview).
    const [navigation, tabs, personalizationPreview] = await Promise.all([
        getNavigation(args, req).catch(recover('navigation', [])),
        getBrandTabs(args, req).catch(recover('brand tabs', [])),
        import.meta.env.DEV || req.preview
            ? getPersonalizationPreviewData(args, req).catch(recover('personalization preview data', null))
            : Promise.resolve(null),
    ]);

    return { siteId: req.brand.siteId, preview: req.preview, navigation, tabs, personalizationPreview };
}

/**
 * Brand layout: brand tabs, Contentful header navigation, main content and footer, inside the Live Preview and
 * Contentful Personalization providers. Routes that use it are prefixed `_app.`.
 */
export default function BrandLayout({ loaderData }: { loaderData: LoaderData }) {
    const { siteId, preview, navigation, tabs, personalizationPreview } = loaderData;
    const mainPaddingAttrs = mainPaddingDataAttributes(usePageUIConfig());
    const currentTab = tabs.find((tab) => tab.siteId === siteId);

    return (
        <LivePreviewProvider enabled={preview}>
            <PersonalizationProvider previewData={personalizationPreview}>
                <SkipLink />
                <BrandTabs tabs={tabs} />
                <SiteHeader navigation={navigation} tab={currentTab} />
                <main id="main-content" tabIndex={-1} className="grow" {...mainPaddingAttrs}>
                    <Outlet />
                </main>
                <SiteFooter navigation={navigation} tabs={tabs} currentSiteId={siteId} />
            </PersonalizationProvider>
        </LivePreviewProvider>
    );
}
