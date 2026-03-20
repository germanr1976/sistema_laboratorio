import type { NextFunction, Request, Response } from 'express';
import { recordRequestMetric } from '@/config/runtimeMetrics';

function resolveRouteKey(req: Request): string {
    const method = req.method.toUpperCase();
    const base = req.baseUrl || '';
    const routePath = typeof req.route?.path === 'string' ? req.route.path : req.path || '/';
    return `${method} ${base}${routePath}`.trim();
}

export function requestTelemetryMiddleware(req: Request, res: Response, next: NextFunction): void {
    const startedAt = process.hrtime.bigint();

    res.on('finish', () => {
        const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
        const routeKey = resolveRouteKey(req);
        const statusCode = res.statusCode;

        recordRequestMetric(routeKey, statusCode, durationMs);

        const logPayload = {
            method: req.method,
            path: req.originalUrl,
            route: routeKey,
            statusCode,
            durationMs: Number(durationMs.toFixed(2)),
            userId: req.user?.id,
            tenantId: req.tenantId,
        };

        if (statusCode >= 500) {
            req.log.error(logPayload, 'request_completed');
            return;
        }

        if (statusCode >= 400) {
            req.log.warn(logPayload, 'request_completed');
            return;
        }

        req.log.info(logPayload, 'request_completed');
    });

    next();
}
