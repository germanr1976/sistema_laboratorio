import express from 'express';
import request from 'supertest';
import { beforeEach, describe, test, vi } from 'vitest';

vi.mock('@/config/upload', () => ({
    upload: {
        fields: () => (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
    },
}));

vi.mock('../controllers/study.controllers', () => ({
    createStudy: (_req: express.Request, res: express.Response) => res.status(201).json({ success: true }),
    getMyStudies: (_req: express.Request, res: express.Response) => res.status(200).json({ success: true }),
    getAllStudies: (_req: express.Request, res: express.Response) => res.status(200).json({ success: true }),
    getMyStudiesAsPatient: (_req: express.Request, res: express.Response) => res.status(200).json({ success: true }),
    getPatientByDni: (_req: express.Request, res: express.Response) => res.status(200).json({ success: true }),
    downloadStudy: (_req: express.Request, res: express.Response) => res.status(200).json({ success: true }),
    getStudyById: (_req: express.Request, res: express.Response) => res.status(200).json({ success: true }),
    updateStudy: (_req: express.Request, res: express.Response) => res.status(200).json({ success: true }),
    updateStudyStatus: (_req: express.Request, res: express.Response) => res.status(200).json({ success: true }),
    updateStudyPdf: (_req: express.Request, res: express.Response) => res.status(200).json({ success: true }),
    deleteAttachment: (_req: express.Request, res: express.Response) => res.status(200).json({ success: true }),
    cancelStudy: (_req: express.Request, res: express.Response) => res.status(200).json({ success: true }),
}));

vi.mock('@/middlewares/tenantContext.middleware', () => ({
    tenantContext: (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
}));

vi.mock('@/middlewares/quotaGuard.middleware', () => ({
    quotaGuard: (_type: string) => (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
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
            return res.status(403).json({ success: false, message: 'Acceso denegado. Se requieren permisos de bioquímico' });
        }
        return next();
    },
    isAdmin: (req: express.Request, res: express.Response, next: express.NextFunction) => {
        const role = String(req.user?.role?.name || '').toUpperCase();
        if (role !== 'ADMIN') {
            return res.status(403).json({ success: false, message: 'Acceso denegado. Se requieren permisos de administrador' });
        }
        return next();
    },
    isPatient: (req: express.Request, res: express.Response, next: express.NextFunction) => {
        const role = String(req.user?.role?.name || '').toUpperCase();
        if (role !== 'PATIENT') {
            return res.status(403).json({ success: false, message: 'Acceso denegado. Se requieren permisos de paciente' });
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
    const routerModule = await import('./study.routes.js');
    const router = routerModule.default as unknown as express.Router;
    const app = express();
    app.use(express.json());
    app.use(router);
    return app;
}

describe('study.routes authz', () => {
    beforeEach(() => {
        vi.resetModules();
    });

    test('CP-STUDY-06: PATIENT no puede crear estudio', async () => {
        const app = await buildApp();
        await request(app)
            .post('/')
            .set('x-role', 'PATIENT')
            .send({ dni: '12345678', studyName: 'X' })
            .expect(403);
    });

    test('CP-STUDY-05: BIOCHEMIST puede crear estudio', async () => {
        const app = await buildApp();
        await request(app)
            .post('/')
            .set('x-role', 'BIOCHEMIST')
            .set('x-permissions', 'tenant.studies.create')
            .send({ dni: '12345678', studyName: 'X' })
            .expect(201);
    });

    test('deniega operación clínica si BIOCHEMIST no tiene permission key', async () => {
        const app = await buildApp();
        await request(app)
            .post('/')
            .set('x-role', 'BIOCHEMIST')
            .send({ dni: '12345678', studyName: 'X' })
            .expect(403);
    });

    test('CP-STUDY-04: solo ADMIN accede a /all', async () => {
        const app = await buildApp();
        await request(app).get('/all').set('x-role', 'BIOCHEMIST').expect(403);
        await request(app).get('/all').set('x-role', 'ADMIN').expect(200);
    });

    test('CP-STUDY-01: /patient/me solo permite PATIENT', async () => {
        const app = await buildApp();
        await request(app).get('/patient/me').set('x-role', 'BIOCHEMIST').expect(403);
        await request(app).get('/patient/me').set('x-role', 'PATIENT').expect(200);
    });
});
