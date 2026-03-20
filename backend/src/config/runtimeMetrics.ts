type RouteStats = {
    requests: number;
    errors4xx: number;
    errors5xx: number;
    rateLimited: number;
    totalLatencyMs: number;
    maxLatencyMs: number;
};

type MetricsTotals = {
    requests: number;
    errors4xx: number;
    errors5xx: number;
    rateLimited: number;
};

type RuntimeAlertSeverity = 'alta' | 'media' | 'baja';

type RuntimeAlert = {
    id: string;
    severity: RuntimeAlertSeverity;
    title: string;
    detail: string;
    metric: string;
    value: number;
    threshold: number;
};

const totals: MetricsTotals = {
    requests: 0,
    errors4xx: 0,
    errors5xx: 0,
    rateLimited: 0,
};

const routeMetrics = new Map<string, RouteStats>();
const startedAt = Date.now();

function envNumber(key: string, fallback: number): number {
    const raw = process.env[key];
    const parsed = raw ? Number(raw) : NaN;
    return Number.isFinite(parsed) ? parsed : fallback;
}

function getOrCreateRoute(routeKey: string): RouteStats {
    const existing = routeMetrics.get(routeKey);
    if (existing) return existing;

    const created: RouteStats = {
        requests: 0,
        errors4xx: 0,
        errors5xx: 0,
        rateLimited: 0,
        totalLatencyMs: 0,
        maxLatencyMs: 0,
    };
    routeMetrics.set(routeKey, created);
    return created;
}

export function recordRequestMetric(routeKey: string, statusCode: number, durationMs: number): void {
    totals.requests += 1;
    if (statusCode >= 400 && statusCode < 500) totals.errors4xx += 1;
    if (statusCode >= 500) totals.errors5xx += 1;
    if (statusCode === 429) totals.rateLimited += 1;

    const stats = getOrCreateRoute(routeKey);
    stats.requests += 1;
    if (statusCode >= 400 && statusCode < 500) stats.errors4xx += 1;
    if (statusCode >= 500) stats.errors5xx += 1;
    if (statusCode === 429) stats.rateLimited += 1;
    stats.totalLatencyMs += durationMs;
    stats.maxLatencyMs = Math.max(stats.maxLatencyMs, durationMs);
}

export function getRuntimeMetricsSnapshot() {
    const routes = Array.from(routeMetrics.entries())
        .map(([route, stats]) => ({
            route,
            requests: stats.requests,
            errors4xx: stats.errors4xx,
            errors5xx: stats.errors5xx,
            rateLimited: stats.rateLimited,
            avgLatencyMs: stats.requests > 0 ? Number((stats.totalLatencyMs / stats.requests).toFixed(2)) : 0,
            maxLatencyMs: Number(stats.maxLatencyMs.toFixed(2)),
        }))
        .sort((a, b) => b.requests - a.requests);

    const requestCount = totals.requests;
    const errorRate4xx = requestCount > 0 ? Number(((totals.errors4xx / requestCount) * 100).toFixed(2)) : 0;
    const errorRate5xx = requestCount > 0 ? Number(((totals.errors5xx / requestCount) * 100).toFixed(2)) : 0;

    const thresholdMinRequests = envNumber('OBS_ALERT_MIN_REQUESTS', 20);
    const thresholdErrorRate5xx = envNumber('OBS_ALERT_5XX_RATE_PERCENT', 5);
    const thresholdErrorRate4xx = envNumber('OBS_ALERT_4XX_RATE_PERCENT', 25);
    const thresholdRateLimited = envNumber('OBS_ALERT_429_COUNT', 20);
    const thresholdAvgLatency = envNumber('OBS_ALERT_AVG_LATENCY_MS', 1000);
    const thresholdMaxLatency = envNumber('OBS_ALERT_MAX_LATENCY_MS', 3000);

    const alerts: RuntimeAlert[] = [];

    if (requestCount >= thresholdMinRequests && errorRate5xx >= thresholdErrorRate5xx) {
        alerts.push({
            id: 'runtime-high-5xx-rate',
            severity: 'alta',
            title: 'Tasa de errores 5xx elevada',
            detail: `El porcentaje de errores 5xx alcanzó ${errorRate5xx}% sobre ${requestCount} requests.`,
            metric: 'errorRate5xx',
            value: errorRate5xx,
            threshold: thresholdErrorRate5xx,
        });
    }

    if (requestCount >= thresholdMinRequests && errorRate4xx >= thresholdErrorRate4xx) {
        alerts.push({
            id: 'runtime-high-4xx-rate',
            severity: 'media',
            title: 'Tasa de errores 4xx elevada',
            detail: `El porcentaje de errores 4xx alcanzó ${errorRate4xx}% sobre ${requestCount} requests.`,
            metric: 'errorRate4xx',
            value: errorRate4xx,
            threshold: thresholdErrorRate4xx,
        });
    }

    if (totals.rateLimited >= thresholdRateLimited) {
        alerts.push({
            id: 'runtime-high-429-rate',
            severity: 'media',
            title: 'Incremento de respuestas 429',
            detail: `Se registraron ${totals.rateLimited} respuestas rate-limited.`,
            metric: 'rateLimited',
            value: totals.rateLimited,
            threshold: thresholdRateLimited,
        });
    }

    const worstAvgLatencyRoute = [...routes]
        .filter((r) => r.requests >= Math.max(5, Math.floor(thresholdMinRequests / 2)))
        .sort((a, b) => b.avgLatencyMs - a.avgLatencyMs)[0];

    if (worstAvgLatencyRoute && worstAvgLatencyRoute.avgLatencyMs >= thresholdAvgLatency) {
        alerts.push({
            id: 'runtime-high-avg-latency',
            severity: 'alta',
            title: 'Latencia promedio alta en ruta crítica',
            detail: `${worstAvgLatencyRoute.route} promedia ${worstAvgLatencyRoute.avgLatencyMs} ms.`,
            metric: 'avgLatencyMs',
            value: worstAvgLatencyRoute.avgLatencyMs,
            threshold: thresholdAvgLatency,
        });
    }

    const worstMaxLatencyRoute = [...routes].sort((a, b) => b.maxLatencyMs - a.maxLatencyMs)[0];
    if (worstMaxLatencyRoute && worstMaxLatencyRoute.maxLatencyMs >= thresholdMaxLatency) {
        alerts.push({
            id: 'runtime-high-max-latency',
            severity: 'media',
            title: 'Pico de latencia alto detectado',
            detail: `${worstMaxLatencyRoute.route} registró un pico de ${worstMaxLatencyRoute.maxLatencyMs} ms.`,
            metric: 'maxLatencyMs',
            value: worstMaxLatencyRoute.maxLatencyMs,
            threshold: thresholdMaxLatency,
        });
    }

    if (alerts.length === 0) {
        alerts.push({
            id: 'runtime-healthy',
            severity: 'baja',
            title: 'Sin alertas runtime activas',
            detail: 'Las métricas técnicas están dentro de los umbrales configurados.',
            metric: 'status',
            value: 0,
            threshold: 0,
        });
    }

    return {
        uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
        process: {
            pid: process.pid,
            nodeVersion: process.version,
            memory: process.memoryUsage(),
        },
        totals: {
            ...totals,
            errorRate4xx,
            errorRate5xx,
        },
        thresholds: {
            minRequests: thresholdMinRequests,
            errorRate5xx: thresholdErrorRate5xx,
            errorRate4xx: thresholdErrorRate4xx,
            rateLimited: thresholdRateLimited,
            avgLatencyMs: thresholdAvgLatency,
            maxLatencyMs: thresholdMaxLatency,
        },
        alerts,
        routes,
        topRoutes: routes.slice(0, 10),
    };
}

export function resetRuntimeMetrics(): void {
    totals.requests = 0;
    totals.errors4xx = 0;
    totals.errors5xx = 0;
    totals.rateLimited = 0;
    routeMetrics.clear();
}
