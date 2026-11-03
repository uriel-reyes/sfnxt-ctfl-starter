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
import { ContentLink } from '@/components/contentful/content-link';
import {
    contentTypeId,
    type BrandTab,
    type CfEntry,
    type LinkFields,
    type NavigationFields,
} from '@/lib/contentful/types';

export function SiteFooter({
    navigation,
    tabs,
    currentSiteId,
}: {
    navigation: CfEntry<NavigationFields>[];
    tabs: BrandTab[];
    currentSiteId: string;
}) {
    const current = tabs.find((tab) => tab.siteId === currentSiteId);
    const family = tabs.map((tab) => tab.name).join(' · ');
    return (
        <footer className="mt-auto bg-muted text-muted-foreground border-t border-border">
            <div className="section-container py-10 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <div>
                    <p className="text-base font-semibold text-foreground">{current?.name}</p>
                    {tabs.length > 1 && <p className="mt-1 text-sm">A family of brands: {family}</p>}
                </div>
                {navigation.length > 0 && (
                    <nav aria-label="Footer">
                        <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                            {navigation.map((item) => {
                                const target = item.fields.target;
                                const label = item.fields.label;
                                if (!label) return null;
                                return (
                                    <li key={item.sys.id}>
                                        {contentTypeId(target) === 'link' ? (
                                            <ContentLink
                                                link={target as CfEntry<LinkFields>}
                                                className="hover:text-foreground">
                                                {label}
                                            </ContentLink>
                                        ) : (
                                            <ContentLink entry={target} className="hover:text-foreground">
                                                {label}
                                            </ContentLink>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    </nav>
                )}
            </div>
            <div className="section-container pb-8 text-xs">
                © {new Date().getFullYear()} {current?.name}. Demo storefront; content delivered by Contentful.
            </div>
        </footer>
    );
}
