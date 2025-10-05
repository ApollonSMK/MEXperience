"use client";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/ui/card';
import { BackButton } from '@/components/back-button';
import type { LucideIcon } from 'lucide-react';

interface ProfilePageProps {
    title: string;
    description: string;
    icon: LucideIcon;
    children: React.ReactNode;
}

export function ProfilePage({ title, description, icon: Icon, children }: ProfilePageProps) {
    return (
        <div className="container mx-auto max-w-5xl px-4 py-16">
            <BackButton />
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <Icon className="w-8 h-8 text-accent" />
                        <div>
                            <CardTitle className="font-headline text-2xl text-primary">
                                {title}
                            </CardTitle>
                            <CardDescription>
                                {description}
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {children}
                </CardContent>
            </Card>
        </div>
    );
}