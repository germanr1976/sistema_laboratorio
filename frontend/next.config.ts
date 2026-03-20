import type { NextConfig } from "next";

function normalizeApiBaseUrl(value: string): string {
    const trimmed = value.trim().replace(/\/+$/, "");
    if (/^https?:\/\//i.test(trimmed)) {
        return trimmed;
    }

    if (/^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(trimmed)) {
        return `http://${trimmed}`;
    }

    return `https://${trimmed}`;
}

const rawApiUrl = process.env.NEXT_PUBLIC_API_URL;
const normalizedApiUrl = rawApiUrl ? normalizeApiBaseUrl(rawApiUrl) : null;
const apiOrigin = normalizedApiUrl ? new URL(normalizedApiUrl).origin : 'http://localhost:3000';
const isProduction = process.env.NODE_ENV === 'production';

const scriptSrc = isProduction
    ? "script-src 'self' 'unsafe-inline'"
    : "script-src 'self' 'unsafe-inline' 'unsafe-eval'";

const contentSecurityPolicy = [
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    `connect-src 'self' ${apiOrigin}`,
    "font-src 'self' data:",
    "form-action 'self'",
].join('; ');

const nextConfig: NextConfig = {
    reactStrictMode: true,
    outputFileTracingRoot: process.cwd(),
    turbopack: {
        root: process.cwd(),
    },
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    { key: 'Content-Security-Policy', value: contentSecurityPolicy },
                    { key: 'X-Frame-Options', value: 'DENY' },
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
                    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
                ],
            },
        ];
    },
    ...(normalizedApiUrl
        ? {
            env: {
                NEXT_PUBLIC_API_URL: normalizedApiUrl,
            },
        }
        : {}),
};

export default nextConfig;
