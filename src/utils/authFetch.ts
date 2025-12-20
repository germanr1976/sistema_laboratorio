// Pequeño helper para enviar Authorization desde localStorage en peticiones fetch
export function getAuthToken(): string | null {
    try {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem('authToken');
    } catch {
        return null;
    }
}

export function setAuthToken(token: string) {
    try {
        if (typeof window === 'undefined') return;
        localStorage.setItem('authToken', token);
    } catch { }
}

export function clearAuthToken() {
    try {
        if (typeof window === 'undefined') return;
        localStorage.removeItem('authToken');
    } catch { }
}

export async function authFetch(input: RequestInfo, init?: RequestInit) {
    const token = getAuthToken();
    const headers = Object.assign({}, init && init.headers ? init.headers : {},
        token ? { Authorization: `Bearer ${token}` } : {}
    );

    const resp = await fetch(input, Object.assign({}, init || {}, { headers }));
    return resp;
}

export default authFetch;
