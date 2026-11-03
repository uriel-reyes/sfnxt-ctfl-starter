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
import type { Route } from './+types/_app.$slug';
import { LandingPage } from '@/components/contentful/landing-page';
import { getLandingPage } from '@/lib/contentful/content.server';
import { canonicalUrl, notFound, requireContentRequest } from '@/lib/contentful/route.server';
import { urlSlug } from '@/lib/contentful/brand';
import type { CfEntry, LandingPageFields } from '@/lib/contentful/types';

type PageData = { page: CfEntry<LandingPageFields>; url: string };

/** Any other brand `landingPage` by slug, e.g. `/shop` renders `shop-rawlings`. */
export async function loader(args: Route.LoaderArgs): Promise<PageData> {
    const req = requireContentRequest(args);
    const segment = args.params.slug;
    // The home page lives at "/", not at its slug.
    if (!segment || segment === urlSlug(req.brand.homeSlug, req.brand)) notFound();
    const page = await getLandingPage(args, req, segment);
    if (!page) notFound();
    return { page, url: canonicalUrl(args) };
}

export default function ContentPage({ loaderData }: { loaderData: PageData }) {
    return <LandingPage page={loaderData.page} url={loaderData.url} />;
}
