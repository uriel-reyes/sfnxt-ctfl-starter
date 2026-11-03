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
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MAX_QUANTITY } from '@/lib/mock-cart/store';

export function QuantityStepper({
    value,
    onChange,
    min = 1,
    label,
    className,
}: {
    value: number;
    onChange: (value: number) => void;
    min?: number;
    label: string;
    className?: string;
}) {
    const button =
        'flex size-9 items-center justify-center transition-colors hover:bg-muted disabled:opacity-40 disabled:hover:bg-transparent';
    return (
        <div
            role="group"
            aria-label={label}
            className={cn('inline-flex items-center rounded-ui border border-input', className)}>
            <button
                type="button"
                className={button}
                onClick={() => onChange(value - 1)}
                disabled={value <= min}
                aria-label="Decrease quantity">
                <Minus className="size-4" />
            </button>
            <span className="min-w-8 text-center text-sm font-semibold tabular-nums" aria-live="polite">
                {value}
            </span>
            <button
                type="button"
                className={button}
                onClick={() => onChange(value + 1)}
                disabled={value >= MAX_QUANTITY}
                aria-label="Increase quantity">
                <Plus className="size-4" />
            </button>
        </div>
    );
}
