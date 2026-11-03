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
import { type FormEvent, useState } from 'react';
import { useNinetailed } from '@ninetailed/experience.js-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DEMO_EMAIL, DEMO_TRAITS, setMockSignedIn, useMockSignedIn } from '@/lib/personalization/mock-auth';

export default function SignInDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
    const { identify, reset } = useNinetailed();
    const signedIn = useMockSignedIn();
    const [submitting, setSubmitting] = useState(false);

    const resetProfile = () => {
        try {
            reset();
        } catch {
            window.ninetailed?.reset();
        }
    };

    const handleSignIn = async (event: FormEvent) => {
        event.preventDefault();
        if (submitting) return;
        setSubmitting(true);
        try {
            await identify(DEMO_EMAIL, DEMO_TRAITS).catch(() => undefined);
            setMockSignedIn(true);
            onOpenChange(false);
        } finally {
            setSubmitting(false);
        }
    };

    const handleSignOut = () => {
        setMockSignedIn(false);
        resetProfile();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                {signedIn ? (
                    <>
                        <DialogHeader>
                            <DialogTitle>Hi, {DEMO_TRAITS.firstName}</DialogTitle>
                            <DialogDescription>
                                Signed in as {DEMO_EMAIL}. Your demo profile traits are applied to personalization.
                            </DialogDescription>
                        </DialogHeader>
                        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                            {Object.entries(DEMO_TRAITS).map(([key, value]) => (
                                <div key={key} className="contents">
                                    <dt className="text-muted-foreground">{key}</dt>
                                    <dd className="truncate">{String(value)}</dd>
                                </div>
                            ))}
                        </dl>
                        <DialogFooter>
                            <Button variant="outline" onClick={handleSignOut}>
                                Sign out
                            </Button>
                        </DialogFooter>
                    </>
                ) : (
                    <form onSubmit={(event) => void handleSignIn(event)} className="grid gap-4">
                        <DialogHeader>
                            <DialogTitle>Sign in</DialogTitle>
                            <DialogDescription>
                                Demo sign-in: no account is checked. Signing in sends the demo shopper&apos;s traits to
                                Contentful Personalization.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-2">
                            <Label htmlFor="demo-email">Email</Label>
                            <Input id="demo-email" type="email" defaultValue={DEMO_EMAIL} autoComplete="email" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="demo-password">Password</Label>
                            <Input
                                id="demo-password"
                                type="password"
                                defaultValue="demo-password"
                                autoComplete="current-password"
                            />
                        </div>
                        <DialogFooter className="gap-2 sm:justify-between">
                            <Button type="button" variant="ghost" onClick={resetProfile}>
                                Reset profile
                            </Button>
                            <Button type="submit" disabled={submitting}>
                                {submitting ? 'Signing in…' : 'Sign in'}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
