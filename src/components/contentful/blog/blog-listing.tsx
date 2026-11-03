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
import { useLiveEntry } from '@/components/contentful/live-preview/use-live-entry';
import { BlogPostCard } from '@/components/contentful/sections/cards';
import { Hero, Sections } from '@/components/contentful/sections/section-renderer';
import { SECTION_TYPES } from '@/components/contentful/sections/component-renderer';
import { useInspector } from '@/lib/contentful/inspector';
import { resolveMedia } from '@/lib/contentful/media';
import {
    contentTypeId,
    type BlogPostFields,
    type CfEntry,
    type DynamicListingPageFields,
} from '@/lib/contentful/types';

/** Above-the-fold post tiles load eagerly; the rest are lazy. */
const EAGER_TILES = 3;
const DEFAULT_TITLE = 'Blog';

/**
 * `/blog`: the brand's blog posts, newest first. The brand's `dynamicListingPage` for blog posts, when authored,
 * supplies the title, teaser, hero, SEO and sections below the posts; without one the page uses defaults.
 */
export function BlogListing({
    listing: loaded,
    posts,
    url,
}: {
    listing: CfEntry<DynamicListingPageFields> | null;
    posts: CfEntry<BlogPostFields>[];
    url: string;
}) {
    const cf = useInspector();
    const listing = useLiveEntry(loaded);
    const f = listing?.fields;
    const title = f?.title || DEFAULT_TITLE;
    // The hero and sections come from the loader, not the live listing: each one applies its own live edits.
    const loadedHero = loaded?.fields.hero;
    const hero = loadedHero && SECTION_TYPES.has(contentTypeId(loadedHero)) ? loadedHero : undefined;
    // A banner or CTA hero renders the page's h1 from its heading; otherwise the header below does.
    const heroHasHeading = Boolean(hero?.fields?.heading);

    return (
        <>
            <ContentSeo
                seo={f?.seoMetadata}
                title={title}
                description={f?.teaser}
                image={resolveMedia(f?.media)?.url}
                url={url}
            />
            <Hero entry={hero} />
            <div className="section-container py-10 md:py-14">
                {!heroHasHeading && (
                    <header className="max-w-3xl">
                        <h1 className="text-3xl font-extrabold md:text-5xl" {...cf(listing?.sys.id, 'title')}>
                            {title}
                        </h1>
                        {f?.teaser && (
                            <p className="mt-3 text-muted-foreground md:text-lg" {...cf(listing?.sys.id, 'teaser')}>
                                {f.teaser}
                            </p>
                        )}
                    </header>
                )}
                {posts.length > 0 ? (
                    <div className="mt-10 first:mt-0 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
                        {posts.map((post, index) => (
                            <BlogPostCard key={post.sys.id} post={post} priority={!hero && index < EAGER_TILES} />
                        ))}
                    </div>
                ) : (
                    <p className="mt-10 text-muted-foreground">No posts yet.</p>
                )}
            </div>
            <Sections
                sections={loaded?.fields.additionalSections}
                owner={loaded ?? undefined}
                fieldId="additionalSections"
            />
        </>
    );
}
