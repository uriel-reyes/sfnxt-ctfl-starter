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
import { useSyncExternalStore } from 'react';

/**
 * Mock "signed in" flag for the demo shopper, backed by localStorage and read via `useSyncExternalStore` so the
 * server snapshot ("signed out") hydrates cleanly. There is no real identity provider.
 */
const SIGNED_IN_KEY = 'storefront:mockSignedIn';

/** The demo shopper's id, used as the Ninetailed `identify` uid while signed in. */
export const DEMO_EMAIL = 'jordan@example.com';

/**
 * Resolved-profile traits pushed to Ninetailed on sign-in. Audiences in Contentful can target any of them; replace
 * them with traits from a real identity provider or order history.
 */
export const DEMO_TRAITS = {
    email: DEMO_EMAIL,
    firstName: 'Jordan',
    loyaltyMember: true,
    loyaltyTier: 'Gold',
    isReturningCustomer: true,
    lifetimeOrders: 4,
    lifetimeSpend: 689.96,
    favoriteSport: 'baseball',
    playerPosition: 'infield',
    favoriteCategory: 'gloves',
} as const;

const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    window.addEventListener('storage', listener);
    return () => {
        listeners.delete(listener);
        window.removeEventListener('storage', listener);
    };
}

export function getMockSignedIn(): boolean {
    try {
        return window.localStorage.getItem(SIGNED_IN_KEY) === '1';
    } catch {
        return false;
    }
}

export function setMockSignedIn(value: boolean): void {
    try {
        if (value) window.localStorage.setItem(SIGNED_IN_KEY, '1');
        else window.localStorage.removeItem(SIGNED_IN_KEY);
    } catch {
        // Ignore storage errors.
    }
    for (const listener of listeners) listener();
}

export function useMockSignedIn(): boolean {
    return useSyncExternalStore(subscribe, getMockSignedIn, () => false);
}
