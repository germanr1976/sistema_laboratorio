import type { NextFunction, Request, Response } from 'express';
import { describe, expect, test, vi } from 'vitest';

const recordRequestMetricMock = vi.fn();

vi.mock('@/config/runtimeMetrics', () => ({
    recordRequestMetric: (...args: unknown[]) => recordRequestMetricMock(...args),
}));

import { requestTelemetryMiddleware } from './requestTelemetry.middleware';

function createReq() {
    return {
        method: 'GET',
        originalUrl: '/api/health',
        path: '/health',
        baseUrl: '/api',
        route: { path: '/health' },
        log: {
            info: vi.fn(),
            warn: vi.fn(),
            error: vi.fn(),
        },
    } as unknown as Request;
}

function createRes(statusCode = 200) {
    let finishHandler: (() => void) | undefined;
    return {
        statusCode,
        on: vi.fn((event: string, handler: () => void) => {
            if (event === 'finish') finishHandler = handler;
        }),
        triggerFinish: () => finishHandler?.(),
    } as unknown as Response & { triggerFinish: () => void };
}

describe('requestTelemetry.middleware', () => {
    test('registra métrica y log al finalizar request', () => {
        const req = createReq();
        const res = createRes(200);
        const next = vi.fn() as NextFunction;

        requestTelemetryMiddleware(req, res, next);
        expect(next).toHaveBeenCalled();

        res.triggerFinish();

        expect(recordRequestMetricMock).toHaveBeenCalled();
        expect(req.log.info).toHaveBeenCalledWith(expect.objectContaining({
            method: 'GET',
            path: '/api/health',
            route: 'GET /api/health',
            statusCode: 200,
        }), 'request_completed');
    });
});
