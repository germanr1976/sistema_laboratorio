import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

const replaceMock = vi.fn();
let pathname = '/dashboard';

vi.mock('next/navigation', () => ({
    useRouter: () => ({ replace: replaceMock }),
    usePathname: () => pathname,
}));

vi.mock('../../componentes/SidebarNew', () => ({
    Sidebar: () => <div data-testid="sidebar" />,
}));

import ProtectedLayout from './layout';

describe('ProtectedLayout', () => {
    beforeEach(() => {
        localStorage.clear();
        replaceMock.mockReset();
        pathname = '/dashboard';
    });

    test('redirige pacientes fuera del área protegida profesional', async () => {
        localStorage.setItem('authToken', 'token');
        localStorage.setItem('userType', 'patient');
        localStorage.setItem('userData', JSON.stringify({ role: 'PATIENT' }));

        render(
            <ProtectedLayout>
                <div>contenido protegido</div>
            </ProtectedLayout>
        );

        await waitFor(() => {
            expect(replaceMock).toHaveBeenCalledWith('/paciente/dashboard');
        });
    });

    test('renderiza children para bioquímico en ruta permitida', async () => {
        localStorage.setItem('authToken', 'token');
        localStorage.setItem('userType', 'professional');
        localStorage.setItem('userData', JSON.stringify({ role: 'BIOCHEMIST' }));

        render(
            <ProtectedLayout>
                <div>contenido protegido</div>
            </ProtectedLayout>
        );

        await waitFor(() => {
            expect(screen.getByText('contenido protegido')).toBeInTheDocument();
        });
        expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    });
});
