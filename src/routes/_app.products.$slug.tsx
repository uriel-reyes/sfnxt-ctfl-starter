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
import type { Route } from './+types/_app.products.$slug';
import { ProductDetail } from '@/components/contentful/product-detail';
import { getProduct } from '@/lib/contentful/content.server';
import { canonicalUrl, notFound, requireContentRequest } from '@/lib/contentful/route.server';
import type { CfEntry, ProductFields } from '@/lib/contentful/types';

type ProductData = { product: CfEntry<ProductFields>; url: string };

/** Product detail for a brand `product` entry by slug. */
export async function loader(args: Route.LoaderArgs): Promise<ProductData> {
    const req = requireContentRequest(args);
    const product = await getProduct(args, req, args.params.slug);
    if (!product) notFound();
    return { product, url: canonicalUrl(args) };
}

export default function ProductPage({ loaderData }: { loaderData: ProductData }) {
    return <ProductDetail product={loaderData.product} url={loaderData.url} />;
}
