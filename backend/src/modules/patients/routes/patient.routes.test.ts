import express from 'express';
import request from 'supertest';
import { beforeEach, describe, test, vi } from 'vitest';

vi.mock('@/modules/patients/controllers/patientController', () => ({
    getMyAnalysisController: (_req: express.Request, res: express.Response) => res.status(200).json({ success: true }),
    getAnalysisByIdController: (_req: express.Request, res: express.Response) => res.status(200).json({ success: true }),
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
    isPatient: (req: express.Request, res: express.Response, next: express.NextFunction) => {
        const role = String(req.user?.role?.name || '').toUpperCase();
        if (role !== 'PATIENT') {
            return res.status(403).json({ success: false, message: 'Acceso denegado. Se requieren permisos de paciente' });
        }
        return next();
    },
}));

async function buildApp() {
    const routerModule = await import('./patient.routes.js');
    const router = routerModule.default as unknown as express.Router;
    const app = express();
    app.use(express.json());
    app.use(router);
    return app;
}

describe('patient.routes authz', () => {
    beforeEach(() => {
        vi.resetModules();
    });

    test('solo PATIENT accede a /analysis', async () => {
        const app = await buildApp();
        await request(app).get('/analysis').set('x-role', 'BIOCHEMIST').expect(403);
        await request(app).get('/analysis').set('x-role', 'PATIENT').expect(200);
    });

    test('solo PATIENT accede a /analysis/:id', async () => {
        const app = await buildApp();
        await request(app).get('/analysis/10').set('x-role', 'ADMIN').expect(403);
        await request(app).get('/analysis/10').set('x-role', 'PATIENT').expect(200);
    });
});
