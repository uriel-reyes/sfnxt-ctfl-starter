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
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { UserRound } from 'lucide-react';
import { useNinetailed, useProfile } from '@ninetailed/experience.js-react';
import { Button } from '@/components/ui/button';
import { DEMO_EMAIL, DEMO_TRAITS, useMockSignedIn } from '@/lib/personalization/mock-auth';

const SignInDialog = lazy(() => import('./sign-in-dialog'));

/**
 * Header trigger for the demo sign-in. Signing in pushes the demo shopper's traits to the Ninetailed profile with
 * `identify`, so trait-based audiences activate. The dialog is mounted on first open only.
 */
export function SignIn() {
    const signedIn = useMockSignedIn();
    const [open, setOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const { identify } = useNinetailed();

    // The flag lives in localStorage separately from the Ninetailed profile. If the profile is replaced while the
    // flag stays set (namespace reset, expired profile), re-identify once so the traits come back.
    const { profile, loading } = useProfile();
    const resynced = useRef(false);
    useEffect(() => {
        if (!signedIn) {
            resynced.current = false;
            return;
        }
        if (loading || !profile || resynced.current || profile.traits?.email === DEMO_EMAIL) return;
        resynced.current = true;
        void identify(DEMO_EMAIL, DEMO_TRAITS).catch(() => undefined);
    }, [signedIn, loading, profile, identify]);

    return (
        <>
            <Button
                variant="ghost"
                className="text-header-foreground hover:bg-transparent hover:opacity-70 gap-1.5 px-2"
                aria-label={signedIn ? 'Account' : 'Sign in'}
                data-testid="header-sign-in"
                onClick={() => {
                    setMounted(true);
                    setOpen(true);
                }}>
                <UserRound className="size-5" />
                <span className="hidden lg:inline text-sm">
                    {signedIn ? `Hi, ${DEMO_TRAITS.firstName}` : 'Sign in'}
                </span>
            </Button>
            {mounted && (
                <Suspense fallback={null}>
                    <SignInDialog open={open} onOpenChange={setOpen} />
                </Suspense>
            )}
        </>
    );
}
