import { afterEach, describe, expect, test, vi } from 'vitest';
import { authFetch, clearAuthToken, setAuthToken } from './authFetch';

describe('authFetch', () => {
    afterEach(() => {
        clearAuthToken();
        vi.restoreAllMocks();
    });

    test('agrega Authorization cuando existe authToken', async () => {
        const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
        vi.stubGlobal('fetch', fetchMock);
        setAuthToken('token-prueba');

        await authFetch('/api/demo', { method: 'GET' });

        expect(fetchMock).toHaveBeenCalledWith('/api/demo', expect.objectContaining({
            headers: expect.objectContaining({ Authorization: 'Bearer token-prueba' }),
        }));
    });

    test('no agrega Authorization cuando no hay token', async () => {
        const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
        vi.stubGlobal('fetch', fetchMock);

        await authFetch('/api/demo', { method: 'GET' });

        expect(fetchMock).toHaveBeenCalledWith('/api/demo', expect.objectContaining({
            headers: {},
        }));
    });
});
