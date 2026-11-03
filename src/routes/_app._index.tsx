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
import { redirect } from 'react-router';
import type { Route } from './+types/_app._index';
import { getConfig } from '@salesforce/storefront-next-runtime/config';
import { resolvePrefix } from '@salesforce/storefront-next-runtime/site-context';
import { LandingPage } from '@/components/contentful/landing-page';
import { getHomePage, resolveDynamicCollections } from '@/lib/contentful/content.server';
import { canonicalUrl, notFound, requireContentRequest } from '@/lib/contentful/route.server';
import type { CfEntry, LandingPageFields } from '@/lib/contentful/types';

type HomeData = { page: CfEntry<LandingPageFields>; url: string };

/** The brand home page: the Contentful `landingPage` whose slug is the brand's `homeSlug`. */
export async function loader(args: Route.LoaderArgs): Promise<HomeData> {
    const config = getConfig(args.context);
    const requestUrl = new URL(args.request.url);

    // Bare "/" goes to the default brand's prefixed home page.
    if (requestUrl.pathname === '/' && config.url?.prefix && config.url.prefix !== '/') {
        const siteRef = config.siteAliasMap?.[config.defaultSiteId] ?? config.defaultSiteId;
        const defaultSite = config.commerce.sites.find((s) => s.id === config.defaultSiteId);
        const defaultLocale = defaultSite?.defaultLocale ?? config.i18n.fallbackLng;
        const localeRef = config.localeAliasMap?.[defaultLocale] ?? defaultLocale;
        const prefixedPath = resolvePrefix({
            prefix: config.url.prefix,
            params: { siteId: siteRef, localeId: localeRef },
        });
        throw redirect(`${prefixedPath}/${requestUrl.search}`);
    }

    const req = requireContentRequest(args);
    const page = await getHomePage(args, req);
    if (!page) notFound();
    return { page: await resolveDynamicCollections(args, req, page, 'sections'), url: canonicalUrl(args) };
}

export default function HomePage({ loaderData }: { loaderData: HomeData }) {
    return <LandingPage page={loaderData.page} url={loaderData.url} isHome />;
}
