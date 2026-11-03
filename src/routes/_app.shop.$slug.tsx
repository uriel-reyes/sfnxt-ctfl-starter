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
import type { Route } from './+types/_app.shop.$slug';
import { CategoryListing } from '@/components/contentful/category-listing';
import { getCategory, getCategoryProducts } from '@/lib/contentful/content.server';
import { canonicalUrl, notFound, requireContentRequest } from '@/lib/contentful/route.server';
import type { CfEntry, ProductCategoryFields, ProductFields } from '@/lib/contentful/types';

type CategoryData = { category: CfEntry<ProductCategoryFields>; products: CfEntry<ProductFields>[]; url: string };

/**
 * Product listing for a brand `productCategory` (`/shop/bats` resolves `bats-easton` on Easton, `bats` on Rawlings).
 * The product grid is the LCP, so products are awaited with the category.
 */
export async function loader(args: Route.LoaderArgs): Promise<CategoryData> {
    const req = requireContentRequest(args);
    const category = await getCategory(args, req, args.params.slug);
    if (!category) notFound();
    const products = await getCategoryProducts(args, req, category.sys.id);
    return { category, products, url: canonicalUrl(args) };
}

export default function CategoryPage({ loaderData }: { loaderData: CategoryData }) {
    return <CategoryListing category={loaderData.category} products={loaderData.products} url={loaderData.url} />;
}
