export function resolveApiBaseUrl(): string | null {
    const raw = (process.env.NEXT_PUBLIC_API_URL || '').trim();

    if (!raw || raw.toLowerCase() === 'undefined' || raw.toLowerCase() === 'null') {
        if (process.env.NODE_ENV !== 'production') {
            return 'http://localhost:3000';
        }
        return null;
    }

    const noTrailingSlash = raw.replace(/\/+$/, '');
    if (/^https?:\/\//i.test(noTrailingSlash)) {
        return noTrailingSlash;
    }

    if (/^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(noTrailingSlash)) {
        return `http://${noTrailingSlash}`;
    }

    return `https://${noTrailingSlash}`;
}