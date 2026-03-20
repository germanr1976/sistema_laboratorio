#!/usr/bin/env node

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { performance } from 'node:perf_hooks';

const baseUrl = (process.env.PERF_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const totalRequests = Number(process.env.PERF_REQUESTS || 300);
const concurrency = Number(process.env.PERF_CONCURRENCY || 20);
const timeoutMs = Number(process.env.PERF_TIMEOUT_MS || 5000);
const endpoints = (process.env.PERF_ENDPOINTS || '/api/health,/api')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

if (!Number.isFinite(totalRequests) || totalRequests <= 0) {
    throw new Error('PERF_REQUESTS debe ser un numero positivo.');
}

if (!Number.isFinite(concurrency) || concurrency <= 0) {
    throw new Error('PERF_CONCURRENCY debe ser un numero positivo.');
}

if (endpoints.length === 0) {
    throw new Error('Defini al menos un endpoint en PERF_ENDPOINTS.');
}

function percentile(values, p) {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
    return sorted[idx];
}

function average(values) {
    if (values.length === 0) return 0;
    const total = values.reduce((sum, value) => sum + value, 0);
    return total / values.length;
}

async function runScenario(endpoint) {
    const latencies = [];
    const statuses = new Map();
    const errors = [];

    let sent = 0;
    let completed = 0;
    const startedAt = performance.now();

    async function worker() {
        while (true) {
            if (sent >= totalRequests) return;
            sent += 1;

            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), timeoutMs);
            const requestStartedAt = performance.now();

            try {
                const response = await fetch(`${baseUrl}${endpoint}`, {
                    method: 'GET',
                    signal: controller.signal,
                    headers: {
                        Accept: 'application/json',
                    },
                });

                const latency = performance.now() - requestStartedAt;
                latencies.push(latency);

                const key = String(response.status);
                statuses.set(key, (statuses.get(key) || 0) + 1);
            } catch (error) {
                const latency = performance.now() - requestStartedAt;
                latencies.push(latency);
                errors.push(error instanceof Error ? error.message : 'Error desconocido');
                statuses.set('ERR', (statuses.get('ERR') || 0) + 1);
            } finally {
                clearTimeout(timer);
                completed += 1;
            }
        }
    }

    const workers = Array.from({ length: Math.min(concurrency, totalRequests) }, () => worker());
    await Promise.all(workers);

    const finishedAt = performance.now();
    const durationMs = finishedAt - startedAt;
    const durationSec = durationMs / 1000;

    const statusEntries = Object.fromEntries([...statuses.entries()].sort((a, b) => a[0].localeCompare(b[0])));
    const successCount = Object.entries(statusEntries)
        .filter(([status]) => status !== 'ERR' && Number(status) >= 200 && Number(status) < 400)
        .reduce((sum, [, count]) => sum + Number(count), 0);

    return {
        endpoint,
        totalRequests,
        completed,
        concurrency: Math.min(concurrency, totalRequests),
        timeoutMs,
        durationMs: Number(durationMs.toFixed(2)),
        rps: Number((completed / Math.max(durationSec, 0.001)).toFixed(2)),
        latency: {
            minMs: Number(Math.min(...latencies).toFixed(2)),
            avgMs: Number(average(latencies).toFixed(2)),
            p50Ms: Number(percentile(latencies, 50).toFixed(2)),
            p95Ms: Number(percentile(latencies, 95).toFixed(2)),
            p99Ms: Number(percentile(latencies, 99).toFixed(2)),
            maxMs: Number(Math.max(...latencies).toFixed(2)),
        },
        successRatePct: Number(((successCount / Math.max(completed, 1)) * 100).toFixed(2)),
        statuses: statusEntries,
        sampleErrors: errors.slice(0, 5),
    };
}

function printScenarioResult(result) {
    const { endpoint, latency, rps, successRatePct, statuses } = result;
    console.log(`\nEndpoint: ${endpoint}`);
    console.log(`  p50: ${latency.p50Ms} ms`);
    console.log(`  p95: ${latency.p95Ms} ms`);
    console.log(`  p99: ${latency.p99Ms} ms`);
    console.log(`  avg: ${latency.avgMs} ms`);
    console.log(`  rps: ${rps}`);
    console.log(`  successRate: ${successRatePct}%`);
    console.log(`  statuses: ${JSON.stringify(statuses)}`);
}

function buildRecommendations(scenarios) {
    const recommendations = [];
    for (const scenario of scenarios) {
        if (scenario.latency.p95Ms > 400) {
            recommendations.push(`Revisar consultas/indices del endpoint ${scenario.endpoint}: p95 ${scenario.latency.p95Ms} ms > 400 ms.`);
        }
        if (scenario.latency.p99Ms > 800) {
            recommendations.push(`Investigar outliers en ${scenario.endpoint}: p99 ${scenario.latency.p99Ms} ms > 800 ms.`);
        }
        if (scenario.successRatePct < 99) {
            recommendations.push(`Analizar errores en ${scenario.endpoint}: success rate ${scenario.successRatePct}% < 99%.`);
        }
    }
    if (recommendations.length === 0) {
        recommendations.push('Sin alertas criticas en baseline inicial. Mantener monitoreo semanal de p95/p99.');
    }
    return recommendations;
}

async function main() {
    console.log('Iniciando baseline de performance...');
    console.log(`Base URL: ${baseUrl}`);
    console.log(`Endpoints: ${endpoints.join(', ')}`);
    console.log(`Requests por endpoint: ${totalRequests}`);
    console.log(`Concurrencia: ${Math.min(concurrency, totalRequests)}`);

    const scenarios = [];
    for (const endpoint of endpoints) {
        const result = await runScenario(endpoint);
        scenarios.push(result);
        printScenarioResult(result);
    }

    const generatedAt = new Date().toISOString();
    const recommendations = buildRecommendations(scenarios);

    const report = {
        generatedAt,
        baseUrl,
        config: {
            totalRequests,
            concurrency,
            timeoutMs,
            endpoints,
        },
        scenarios,
        recommendations,
    };

    const reportDir = path.join(process.cwd(), 'reports', 'performance');
    await mkdir(reportDir, { recursive: true });
    const fileStamp = generatedAt.replace(/[:.]/g, '-');
    const reportPath = path.join(reportDir, `baseline-${fileStamp}.json`);
    await writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8');

    console.log('\nRecomendaciones:');
    recommendations.forEach((item) => console.log(`- ${item}`));
    console.log(`\nReporte guardado en: ${reportPath}`);
}

main().catch((error) => {
    console.error('Fallo baseline de performance:', error instanceof Error ? error.message : error);
    process.exit(1);
});
