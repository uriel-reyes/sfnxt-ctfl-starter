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
import { ContentSeo } from '@/components/contentful/content-seo';
import { Hero, Sections } from '@/components/contentful/sections/section-renderer';
import { contentTypeId, type CfEntry, type LandingPageFields } from '@/lib/contentful/types';

/** A Contentful `landingPage`: hero plus sections. */
export function LandingPage({
    page,
    url,
    isHome = false,
}: {
    page: CfEntry<LandingPageFields>;
    url: string;
    isHome?: boolean;
}) {
    const { hero, sections, title, teaser, seoMetadata } = page.fields;
    // The hero renders the page's h1; pages without a section-type hero get a visually hidden one.
    const heroHasHeading = Boolean(
        hero && ['banner', 'callToAction'].includes(contentTypeId(hero)) && hero.fields?.heading
    );

    return (
        <>
            {/* Without an seo title, the home page is titled with the brand name alone. */}
            <ContentSeo seo={seoMetadata} title={isHome ? undefined : title} description={teaser} url={url} />
            {!heroHasHeading && title && <h1 className="sr-only">{title}</h1>}
            <Hero entry={hero} />
            <Sections sections={sections} />
        </>
    );
}
