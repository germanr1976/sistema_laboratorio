"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PlatformAppIndexPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/platform/tenants');
    }, [router]);

    return <div className="p-6">Redirigiendo a Tenants y Planes...</div>;
}
