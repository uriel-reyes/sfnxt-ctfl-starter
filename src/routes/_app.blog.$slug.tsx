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
import type { Route } from './+types/_app.blog.$slug';
import { BlogPost } from '@/components/contentful/blog/blog-post';
import { getBlogPost } from '@/lib/contentful/content.server';
import { canonicalUrl, notFound, requireContentRequest } from '@/lib/contentful/route.server';
import type { BlogPostFields, CfEntry } from '@/lib/contentful/types';

type BlogPostData = { post: CfEntry<BlogPostFields>; url: string };

/** A brand `blogPost` by slug (`/blog/my-post` resolves `my-post-<tag>` first, then `my-post`). */
export async function loader(args: Route.LoaderArgs): Promise<BlogPostData> {
    const req = requireContentRequest(args);
    const post = await getBlogPost(args, req, args.params.slug);
    if (!post) notFound();
    return { post, url: canonicalUrl(args) };
}

export default function BlogPostPage({ loaderData }: { loaderData: BlogPostData }) {
    return <BlogPost post={loaderData.post} url={loaderData.url} />;
}
