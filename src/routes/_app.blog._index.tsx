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
import type { Route } from './+types/_app.blog._index';
import { BlogListing } from '@/components/contentful/blog/blog-listing';
import { getBlogListingPage, getBlogPosts } from '@/lib/contentful/content.server';
import { canonicalUrl, notFound, requireContentRequest } from '@/lib/contentful/route.server';
import type { BlogPostFields, CfEntry, DynamicListingPageFields } from '@/lib/contentful/types';

type BlogData = {
    listing: CfEntry<DynamicListingPageFields> | null;
    posts: CfEntry<BlogPostFields>[];
    url: string;
};

/**
 * The brand's blog index. Posts are the page's main content (and LCP), so they are awaited with the optional
 * `dynamicListingPage` that frames them. A brand with neither has no blog: 404.
 */
export async function loader(args: Route.LoaderArgs): Promise<BlogData> {
    const req = requireContentRequest(args);
    const [listing, posts] = await Promise.all([getBlogListingPage(args, req), getBlogPosts(args, req)]);
    if (!listing && posts.length === 0) notFound();
    return { listing, posts, url: canonicalUrl(args) };
}

export default function BlogIndexPage({ loaderData }: { loaderData: BlogData }) {
    return <BlogListing listing={loaderData.listing} posts={loaderData.posts} url={loaderData.url} />;
}
