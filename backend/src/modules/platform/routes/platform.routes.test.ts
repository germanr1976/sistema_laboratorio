import express from 'express';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

let callOrder: string[] = [];
const originalEnv = { ...process.env };

vi.mock('@/modules/auth/middlewares/auth.middleware', () => ({
    authMiddleware: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
        const role = String(req.header('x-role') || 'PLATFORM_ADMIN').toUpperCase();
        Object.assign(req as object, { user: { roleId: 1, role: { name: role }, isPlatformAdmin: role === 'PLATFORM_ADMIN' } });
        callOrder.push('auth');
        next();
    },
    isPlatformAdmin: (req: express.Request, res: express.Response, next: express.NextFunction) => {
        const role = String(req.user?.role?.name || '').toUpperCase();
        const legacy = Boolean(req.user?.isPlatformAdmin);
        if (role !== 'PLATFORM_ADMIN' && !legacy) {
            return res.status(403).json({ success: false });
        }
        callOrder.push('platform-admin');
        return next();
    },
}));

vi.mock('@/modules/auth/middlewares/permissions.middleware', () => ({
    requireTenantPermission: (permissionKey: string) => (req: express.Request, res: express.Response, next: express.NextFunction) => {
        callOrder.push(`perm:${permissionKey}`);
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

vi.mock('@/modules/audit/controllers/audit.controllers', () => ({
    listGlobalAuditEvents: (_req: express.Request, res: express.Response) => res.status(200).json({ success: true }),
}));

vi.mock('@/modules/platform/controllers/platform.controllers', () => ({
    bootstrapPlatformAdminController: (_req: express.Request, res: express.Response) => res.status(201).json({ success: true }),
    listTenantsController: (_req: express.Request, res: express.Response) => {
        callOrder.push('controller');
        res.status(200).json({ success: true, order: callOrder });
    },
    createTenantController: (_req: express.Request, res: express.Response) => res.status(201).json({ success: true }),
    updateTenantController: (_req: express.Request, res: express.Response) => res.status(200).json({ success: true }),
    deleteTenantController: (_req: express.Request, res: express.Response) => res.status(200).json({ success: true }),
    createTenantAdminController: (_req: express.Request, res: express.Response) => res.status(201).json({ success: true }),
    setTenantSuspendedByPlatformController: (_req: express.Request, res: express.Response) => res.status(200).json({ success: true }),
    assignTenantPlanController: (_req: express.Request, res: express.Response) => res.status(200).json({ success: true }),
    getGlobalMetricsController: (_req: express.Request, res: express.Response) => res.status(200).json({ success: true }),
    getRuntimeMetricsController: (_req: express.Request, res: express.Response) => res.status(200).json({ success: true }),
}));

async function buildApp() {
    vi.resetModules();
    const routerModule = await import('./platform.routes.js');
    const router = routerModule.default as unknown as express.Router;
    const app = express();
    app.use(express.json());
    app.use(router);
    return app;
}

describe('platform.routes', () => {
    beforeEach(() => {
        callOrder = [];
        process.env = { ...originalEnv };
    });

    afterEach(() => {
        process.env = { ...originalEnv };
    });

    test('ejecuta auth e isPlatformAdmin antes del controlador en rutas protegidas', async () => {
        const app = await buildApp();
        const response = await request(app).get('/tenants').expect(200);
        expect(response.body.order).toEqual(['auth', 'platform-admin', 'controller']);
    });

    test('ejecuta guard de permission key antes del controlador en rutas mutantes', async () => {
        const app = await buildApp();
        await request(app)
            .post('/tenants')
            .set('x-permissions', 'platform.tenants.create')
            .send({ name: 'tenant-demo', slug: 'tenant-demo' })
            .expect(201);
        expect(callOrder).toContain('perm:platform.tenants.create');
    });

    test('CP-PLAT-01 y CP-PLAT-04: rutas platform deniegan usuarios no platform', async () => {
        const app = await buildApp();
        await request(app).get('/tenants').set('x-role', 'ADMIN').expect(403);
        await request(app).get('/metrics/global').set('x-role', 'BIOCHEMIST').expect(403);
    });

    test('deniega rutas mutantes cuando falta permission key requerida', async () => {
        const app = await buildApp();
        await request(app)
            .delete('/tenants/42')
            .set('x-role', 'PLATFORM_ADMIN')
            .expect(403);
    });

    test('limita bootstrap-admin cuando se excede el máximo permitido', async () => {
        process.env.NODE_ENV = 'development';
        process.env.RATE_LIMIT_ADMIN_WINDOW_MS = '60000';
        process.env.RATE_LIMIT_ADMIN_MAX = '1';

        const app = await buildApp();

        await request(app).post('/bootstrap-admin').send({}).expect(201);
        const response = await request(app).post('/bootstrap-admin').send({}).expect(429);
        expect(response.body.message).toMatch(/solicitudes administrativas/i);
    });
});
