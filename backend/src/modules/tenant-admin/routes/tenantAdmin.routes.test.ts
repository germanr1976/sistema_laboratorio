import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, test, vi } from 'vitest';

let callOrder: string[] = [];

vi.mock('@/modules/auth/middlewares/auth.middleware', () => ({
    authMiddleware: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
        const role = String(req.header('x-role') || 'ADMIN').toUpperCase();
        Object.assign(req as object, { user: { role: { name: role } } });
        callOrder.push('auth');
        next();
    },
    isAdmin: (req: express.Request, res: express.Response, next: express.NextFunction) => {
        const role = String(req.user?.role?.name || '').toUpperCase();
        if (role !== 'ADMIN') {
            return res.status(403).json({ success: false });
        }
        callOrder.push('admin');
        return next();
    },
}));

vi.mock('@/middlewares/tenantContext.middleware', () => ({
    tenantContext: (_req: express.Request, _res: express.Response, next: express.NextFunction) => {
        callOrder.push('tenant');
        next();
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

vi.mock('@/modules/tenant-admin/controllers/tenantAdmin.controllers', () => ({
    listTenantUsersController: (_req: express.Request, res: express.Response) => {
        callOrder.push('controller');
        res.status(200).json({ success: true, order: callOrder });
    },
    createTenantUserController: (_req: express.Request, res: express.Response) => res.status(201).json({ success: true }),
    updateTenantUserController: (_req: express.Request, res: express.Response) => res.status(200).json({ success: true }),
    deleteTenantUserController: (_req: express.Request, res: express.Response) => res.status(200).json({ success: true }),
    getTenantSettingsController: (_req: express.Request, res: express.Response) => res.status(200).json({ success: true }),
    updateTenantSettingsController: (_req: express.Request, res: express.Response) => res.status(200).json({ success: true }),
    getTenantPlanStatusController: (_req: express.Request, res: express.Response) => res.status(200).json({ success: true }),
    listRolePermissionsController: (_req: express.Request, res: express.Response) => res.status(200).json({ success: true }),
    setRolePermissionsController: (_req: express.Request, res: express.Response) => res.status(200).json({ success: true }),
}));

async function buildApp() {
    const routerModule = await import('./tenantAdmin.routes.js');
    const router = routerModule.default as unknown as express.Router;
    const app = express();
    app.use(express.json());
    app.use(router);
    return app;
}

describe('tenantAdmin.routes', () => {
    beforeEach(() => {
        callOrder = [];
    });

    test('ejecuta middlewares de auth, tenant y admin antes del controlador', async () => {
        const app = await buildApp();
        const response = await request(app)
            .get('/users')
            .set('x-permissions', 'tenant.users.read')
            .expect(200);
        expect(response.body.order).toEqual(['auth', 'tenant', 'admin', 'perm:tenant.users.read', 'controller']);
    });

    test('CP-TADM-02: BIOCHEMIST no accede a tenant-admin/users', async () => {
        const app = await buildApp();
        await request(app).get('/users').set('x-role', 'BIOCHEMIST').expect(403);
    });

    test('deniega acceso si ADMIN no tiene permission key requerida', async () => {
        const app = await buildApp();
        await request(app).get('/users').set('x-role', 'ADMIN').expect(403);
    });
});
