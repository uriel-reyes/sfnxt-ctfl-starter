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
import { useCallback, useMemo, useSyncExternalStore } from 'react';
import type { CartProduct } from '@/lib/contentful/product';

/**
 * Demo basket with no Commerce backend: one cart per brand site, kept in localStorage and read through
 * `useSyncExternalStore`, so the server snapshot is an empty cart and hydration stays clean. Lines carry a full
 * `CartProduct` snapshot, so the basket renders without re-fetching Contentful.
 */
export type CartLine = CartProduct & { quantity: number };

export type CartSummary = {
    lines: CartLine[];
    count: number;
    /** Sum of priced lines; null when no line has a price. */
    subtotal: number | null;
    currency: string;
};

export const MAX_QUANTITY = 10;
const EMPTY: CartLine[] = [];
const listeners = new Set<() => void>();
// useSyncExternalStore needs a referentially stable snapshot, so parsed lines are memoized per raw string.
const parsed = new Map<string, { raw: string | null; lines: CartLine[] }>();

const storageKey = (siteId: string) => `storefront:${siteId}:cart`;

function readLines(siteId: string): CartLine[] {
    const key = storageKey(siteId);
    let raw: string | null = null;
    try {
        raw = window.localStorage.getItem(key);
    } catch {
        // Storage can throw in some privacy modes; treat as an empty cart.
    }
    const hit = parsed.get(key);
    if (hit && hit.raw === raw) return hit.lines;
    let lines = EMPTY;
    try {
        const value: unknown = raw ? JSON.parse(raw) : [];
        lines = Array.isArray(value) ? (value as CartLine[]) : EMPTY;
    } catch {
        lines = EMPTY;
    }
    parsed.set(key, { raw, lines });
    return lines;
}

function writeLines(siteId: string, lines: CartLine[]): void {
    try {
        window.localStorage.setItem(storageKey(siteId), JSON.stringify(lines));
    } catch {
        // Ignore storage errors: the cart is a demo convenience.
    }
    for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    window.addEventListener('storage', listener);
    return () => {
        listeners.delete(listener);
        window.removeEventListener('storage', listener);
    };
}

const clampQuantity = (n: number) => Math.max(0, Math.min(MAX_QUANTITY, Math.floor(n)));

export function summarize(lines: CartLine[]): CartSummary {
    const priced = lines.filter((line) => typeof line.price === 'number');
    return {
        lines,
        count: lines.reduce((sum, line) => sum + line.quantity, 0),
        subtotal: priced.length
            ? Math.round(priced.reduce((sum, line) => sum + (line.price ?? 0) * line.quantity, 0) * 100) / 100
            : null,
        currency: lines[0]?.currency ?? 'USD',
    };
}

export function getCart(siteId: string): CartSummary {
    return summarize(readLines(siteId));
}

export function addItem(siteId: string, product: CartProduct, quantity = 1): CartSummary {
    const lines = readLines(siteId);
    const existing = lines.find((line) => line.id === product.id);
    const next = existing
        ? lines.map((line) =>
              line.id === product.id ? { ...line, ...product, quantity: clampQuantity(line.quantity + quantity) } : line
          )
        : [...lines, { ...product, quantity: clampQuantity(quantity) }];
    writeLines(siteId, next);
    return getCart(siteId);
}

export function setQuantity(siteId: string, id: string, quantity: number): CartSummary {
    const q = clampQuantity(quantity);
    const lines = readLines(siteId);
    writeLines(
        siteId,
        q === 0
            ? lines.filter((line) => line.id !== id)
            : lines.map((line) => (line.id === id ? { ...line, quantity: q } : line))
    );
    return getCart(siteId);
}

export function removeItem(siteId: string, id: string): CartSummary {
    return setQuantity(siteId, id, 0);
}

export function clearCart(siteId: string): CartSummary {
    writeLines(siteId, []);
    return getCart(siteId);
}

/** Subscribes a component to a brand's cart. Lines are empty on the server and during hydration. */
export function useCart(siteId: string): CartSummary {
    const getSnapshot = useCallback(() => readLines(siteId), [siteId]);
    const lines = useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);
    return useMemo(() => summarize(lines), [lines]);
}

let miniCartOpen = false;
const miniCartListeners = new Set<() => void>();

function subscribeMiniCart(listener: () => void): () => void {
    miniCartListeners.add(listener);
    return () => miniCartListeners.delete(listener);
}

export function setMiniCartOpen(open: boolean): void {
    miniCartOpen = open;
    for (const listener of miniCartListeners) listener();
}

export function useMiniCartOpen(): boolean {
    return useSyncExternalStore(
        subscribeMiniCart,
        () => miniCartOpen,
        () => false
    );
}
