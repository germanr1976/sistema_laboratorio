import express from 'express';
import request from 'supertest';
import { beforeEach, describe, test, vi } from 'vitest';

vi.mock('../controllers/studyRequest.controllers', () => ({
    createStudyRequest: (_req: express.Request, res: express.Response) => res.status(201).json({ success: true }),
    getMyStudyRequests: (_req: express.Request, res: express.Response) => res.status(200).json({ success: true }),
    listStudyRequestsForProfessional: (_req: express.Request, res: express.Response) => res.status(200).json({ success: true }),
    validateStudyRequest: (_req: express.Request, res: express.Response) => res.status(200).json({ success: true }),
    rejectStudyRequest: (_req: express.Request, res: express.Response) => res.status(200).json({ success: true }),
    convertStudyRequest: (_req: express.Request, res: express.Response) => res.status(200).json({ success: true }),
}));

vi.mock('@/middlewares/tenantContext.middleware', () => ({
    tenantContext: (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
}));

vi.mock('@/modules/auth/middlewares/auth.middleware', () => ({
    authMiddleware: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
        const role = String(req.header('x-role') || 'PATIENT').toUpperCase();
        Object.assign(req as object, { user: { role: { name: role } } });
        next();
    },
    isBiochemist: (req: express.Request, res: express.Response, next: express.NextFunction) => {
        const role = String(req.user?.role?.name || '').toUpperCase();
        if (role !== 'BIOCHEMIST') {
            return res.status(403).json({ success: false });
        }
        return next();
    },
    isPatient: (req: express.Request, res: express.Response, next: express.NextFunction) => {
        const role = String(req.user?.role?.name || '').toUpperCase();
        if (role !== 'PATIENT') {
            return res.status(403).json({ success: false });
        }
        return next();
    },
}));

vi.mock('@/modules/auth/middlewares/permissions.middleware', () => ({
    requireTenantPermission: (permissionKey: string) => (req: express.Request, res: express.Response, next: express.NextFunction) => {
        const headerValue = String(req.header('x-permissions') || '');
        const granted = headerValue
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);
        if (!granted.includes(permissionKey)) {
            return res.status(403).json({ success: false, message: 'missing permission' });
        }
        return next();
    },
}));

async function buildApp() {
    const routerModule = await import('./studyRequest.routes.js');
    const router = routerModule.default as unknown as express.Router;
    const app = express();
    app.use(express.json());
    app.use(router);
    return app;
}

describe('studyRequest.routes authz', () => {
    beforeEach(() => {
        vi.resetModules();
    });

    test('CP-SREQ-03: solo BIOCHEMIST puede convertir solicitud', async () => {
        const app = await buildApp();
        await request(app).post('/1/convert').set('x-role', 'PATIENT').expect(403);
        await request(app).post('/1/convert').set('x-role', 'ADMIN').expect(403);
        await request(app)
            .post('/1/convert')
            .set('x-role', 'BIOCHEMIST')
            .set('x-permissions', 'tenant.studyRequests.convert')
            .expect(200);
    });

    test('CP-SREQ-01: /mine solo permite PATIENT', async () => {
        const app = await buildApp();
        await request(app).get('/mine').set('x-role', 'BIOCHEMIST').expect(403);
        await request(app).get('/mine').set('x-role', 'PATIENT').expect(200);
    });

    test('deniega acciones clínicas de solicitudes sin permission key', async () => {
        const app = await buildApp();
        await request(app)
            .patch('/1/validate')
            .set('x-role', 'BIOCHEMIST')
            .expect(403);
    });
});
