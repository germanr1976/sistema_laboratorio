import { describe, expect, test } from 'vitest';
import { canAccessStudy } from './studyAuthorization.service';

describe('studyAuthorization.canAccessStudy', () => {
    const baseStudy = {
        userId: 100,
        biochemistId: 200,
    };

    test('permite al paciente propietario', () => {
        const user = { id: 100, role: { name: 'PATIENT' } };
        expect(canAccessStudy(user, baseStudy)).toBe(true);
    });

    test('permite a ADMIN del tenant', () => {
        const user = { id: 300, role: { name: 'ADMIN' } };
        expect(canAccessStudy(user, baseStudy)).toBe(true);
    });

    test('permite a BIOCHEMIST asignado', () => {
        const user = { id: 200, role: { name: 'BIOCHEMIST' } };
        expect(canAccessStudy(user, baseStudy)).toBe(true);
    });

    test('permite a BIOCHEMIST cuando estudio no tiene bioquimico asignado', () => {
        const user = { id: 333, role: { name: 'BIOCHEMIST' } };
        const study = { ...baseStudy, biochemistId: null };
        expect(canAccessStudy(user, study)).toBe(true);
    });

    test('deniega a usuario sin rol permitido ni propiedad del estudio', () => {
        const user = { id: 999, role: { name: 'PATIENT' } };
        expect(canAccessStudy(user, baseStudy)).toBe(false);
    });

    test('deniega cuando no hay usuario autenticado', () => {
        expect(canAccessStudy(undefined, baseStudy)).toBe(false);
    });
});
