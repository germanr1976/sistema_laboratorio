import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

const pushMock = vi.fn();
const setPlatformAuthTokenMock = vi.fn();

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: pushMock }),
}));

vi.mock('../../../utils/platformAuth', () => ({
    setPlatformAuthToken: (token: string) => setPlatformAuthTokenMock(token),
}));

import PlatformLoginPage from './page';

describe('PlatformLoginPage', () => {
    beforeEach(() => {
        localStorage.clear();
        pushMock.mockReset();
        setPlatformAuthTokenMock.mockReset();
    });

    test('rechaza usuarios sin acceso de plataforma aunque el login sea exitoso', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                data: {
                    token: 'token-demo',
                    user: { role: 'PATIENT' },
                },
            }),
        }));

        render(<PlatformLoginPage />);

        fireEvent.change(screen.getByPlaceholderText('DNI'), { target: { value: '12345678' } });
        fireEvent.change(screen.getByPlaceholderText('Contraseña'), { target: { value: 'secreto' } });
        fireEvent.click(screen.getByRole('button', { name: /ingresar a plataforma/i }));

        await waitFor(() => {
            expect(screen.getByText(/no tiene acceso al portal de plataforma/i)).toBeInTheDocument();
        });
        expect(setPlatformAuthTokenMock).not.toHaveBeenCalled();
        expect(pushMock).not.toHaveBeenCalled();
    });
});
