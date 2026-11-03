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
import { ContentImage } from '@/components/contentful/content-image';
import { ContentLink } from '@/components/contentful/content-link';
import { ContentSeo } from '@/components/contentful/content-seo';
import { CallToAction } from '@/components/contentful/sections/call-to-action';
import { BlogPostCard } from '@/components/contentful/sections/cards';
import { personName } from '@/lib/contentful/blog';
import { useInspector } from '@/lib/contentful/inspector';
import { assetUrl, resolveMedia } from '@/lib/contentful/media';
import { plainText } from '@/lib/contentful/rich-text';
import { stripStega } from '@/lib/contentful/live-preview';
import type { BlogPostFields, CfEntry, PersonFields } from '@/lib/contentful/types';
import { routes } from '@/route-paths';
import { BlogPostBody } from './blog-post-body';
import { useLiveEntry } from '@/components/contentful/live-preview/use-live-entry';

function Authors({ post }: { post: CfEntry<BlogPostFields> }) {
    const authors = (post.fields.author ?? []).filter((person): person is CfEntry<PersonFields> =>
        Boolean(personName(person))
    );
    if (!authors.length) return null;
    return (
        <ul className="mt-6 flex flex-wrap gap-x-8 gap-y-4">
            {authors.map((person) => {
                const avatar = assetUrl(person.fields.avatar);
                const name = personName(person);
                return (
                    <li key={person.sys.id} className="flex items-center gap-3">
                        {avatar && (
                            <ContentImage
                                image={{ url: avatar, alt: '' }}
                                widths={[96]}
                                sizes="48px"
                                className="size-12 rounded-full object-cover"
                            />
                        )}
                        <div className="text-sm">
                            <p className="font-bold">{name}</p>
                            {person.fields.role && <p className="text-muted-foreground">{person.fields.role}</p>}
                        </div>
                    </li>
                );
            })}
        </ul>
    );
}

/** A Contentful `blogPost` at `/blog/:slug`: title, authors, image, body, CTA and related posts. */
export function BlogPost({ post: loaded, url }: { post: CfEntry<BlogPostFields>; url: string }) {
    const post = useLiveEntry(loaded);
    const cf = useInspector();
    const f = post.fields;
    const media = resolveMedia(f.media);
    const related = (f.relatedPosts ?? []).filter((entry) => entry?.fields?.slug);

    return (
        <article className="pb-16 md:pb-24">
            <ContentSeo
                seo={f.seoMetadata}
                title={f.title}
                description={f.teaser || stripStega(plainText(f.body)).slice(0, 160)}
                image={media?.url}
                url={url}
                type="article"
            />
            <header className="mx-auto max-w-3xl px-6 pt-10 md:pt-14">
                <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
                    <ol className="flex flex-wrap items-center gap-2">
                        <li>
                            <ContentLink to={routes.home} className="hover:text-foreground">
                                Home
                            </ContentLink>
                        </li>
                        <li aria-hidden>/</li>
                        <li>
                            <ContentLink to={routes.blog} className="hover:text-foreground">
                                Blog
                            </ContentLink>
                        </li>
                    </ol>
                </nav>
                <h1 className="mt-6 text-3xl font-extrabold leading-tight md:text-5xl" {...cf(post.sys.id, 'title')}>
                    {f.title}
                </h1>
                {f.teaser && (
                    <p className="mt-4 text-lg text-muted-foreground md:text-xl" {...cf(post.sys.id, 'teaser')}>
                        {f.teaser}
                    </p>
                )}
                <Authors post={post} />
            </header>
            {media && (
                <div className="mx-auto mt-10 max-w-5xl px-6" {...cf(post.sys.id, 'media')}>
                    <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
                        <ContentImage
                            image={{ ...media, alt: media.alt || f.title || '' }}
                            priority
                            sizes="(max-width: 1024px) 100vw, 64rem"
                            widths={[480, 768, 1080, 1440, 1920]}
                            className="absolute inset-0 size-full object-cover"
                        />
                    </div>
                </div>
            )}
            {f.body && (
                <div className="mx-auto mt-10 max-w-3xl px-6 text-lg">
                    <BlogPostBody document={f.body} />
                </div>
            )}
            {f.cta && (
                <div className="mt-14">
                    <CallToAction cta={f.cta} />
                </div>
            )}
            {related.length > 0 && (
                <section className="mx-auto mt-16 max-w-7xl px-6" aria-labelledby="related-posts">
                    <h2 id="related-posts" className="mb-8 text-2xl font-extrabold md:text-3xl">
                        Related posts
                    </h2>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {related.map((entry) => (
                            <BlogPostCard key={entry.sys.id} post={entry} />
                        ))}
                    </div>
                </section>
            )}
        </article>
    );
}
