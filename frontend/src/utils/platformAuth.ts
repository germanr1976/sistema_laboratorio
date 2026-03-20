export function getPlatformAuthToken(): string | null {
    try {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem('platformAuthToken');
    } catch {
        return null;
    }
}

export function setPlatformAuthToken(token: string) {
    try {
        if (typeof window === 'undefined') return;
        localStorage.setItem('platformAuthToken', token);
    } catch { }
}

export function clearPlatformSession() {
    try {
        if (typeof window === 'undefined') return;
        localStorage.removeItem('platformAuthToken');
        localStorage.removeItem('platformUserData');
        localStorage.removeItem('platformUserType');
    } catch { }
}

export async function platformAuthFetch(input: RequestInfo, init?: RequestInit) {
    const token = getPlatformAuthToken();
    const headers = Object.assign({}, init && init.headers ? init.headers : {},
        token ? { Authorization: `Bearer ${token}` } : {}
    );

    const resp = await fetch(input, Object.assign({}, init || {}, { headers }));
    return resp;
}

export default platformAuthFetch;
