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

const nextConfig: NextConfig = {
    reactStrictMode: true,
    outputFileTracingRoot: process.cwd(),
    turbopack: {
        root: process.cwd(),
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
