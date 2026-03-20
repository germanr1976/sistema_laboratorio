import express from 'express';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('../controllers/auth.controllers', () => ({
    loginController: (_req: express.Request, res: express.Response) => res.status(401).json({ success: false, message: 'Credenciales inválidas' }),
    registerDoctorController: (_req: express.Request, res: express.Response) => res.status(201).json({ success: true }),
    registerPatientController: (_req: express.Request, res: express.Response) => res.status(201).json({ success: true }),
    requestPasswordRecoveryController: (_req: express.Request, res: express.Response) => res.status(200).json({ success: true }),
    resetPasswordController: (_req: express.Request, res: express.Response) => res.status(200).json({ success: true }),
    changeUserRoleController: (_req: express.Request, res: express.Response) => res.status(200).json({ success: true }),
    setTenantSuspendedController: (_req: express.Request, res: express.Response) => res.status(200).json({ success: true }),
}));

vi.mock('../middlewares/auth.middleware', () => ({
    authMiddleware: (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
    isAdmin: (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
}));

vi.mock('@/middlewares/tenantContext.middleware', () => ({
    tenantContext: (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
}));

const originalEnv = { ...process.env };

async function buildApp() {
    vi.resetModules();
    const routerModule = await import('./auth.routes.js');
    const router = routerModule.default as unknown as express.Router;
    const app = express();
    app.use(express.json());
    app.use(router);
    return app;
}

describe('auth.routes', () => {
    beforeEach(() => {
        process.env = { ...originalEnv };
    });

    afterEach(() => {
        process.env = { ...originalEnv };
    });

    test('limita intentos fallidos de login', async () => {
        process.env.NODE_ENV = 'development';
        process.env.RATE_LIMIT_LOGIN_WINDOW_MS = '60000';
        process.env.RATE_LIMIT_LOGIN_MAX = '2';

        const app = await buildApp();

        await request(app).post('/login').send({ dni: '12345678', password: 'x' }).expect(401);
        await request(app).post('/login').send({ dni: '12345678', password: 'x' }).expect(401);

        const response = await request(app).post('/login').send({ dni: '12345678', password: 'x' }).expect(429);
        expect(response.body.message).toMatch(/Demasiados intentos de inicio de sesión/i);
    });

    test('limita solicitudes de recuperación de contraseña', async () => {
        process.env.NODE_ENV = 'development';
        process.env.RATE_LIMIT_RECOVERY_WINDOW_MS = '60000';
        process.env.RATE_LIMIT_RECOVERY_MAX = '2';

        const app = await buildApp();

        await request(app).post('/request-password-recovery').send({ email: 'a@b.com' }).expect(200);
        await request(app).post('/request-password-recovery').send({ email: 'a@b.com' }).expect(200);

        const response = await request(app).post('/request-password-recovery').send({ email: 'a@b.com' }).expect(429);
        expect(response.body.message).toMatch(/recuperación de contraseña/i);
    });
});
