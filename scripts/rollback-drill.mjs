#!/usr/bin/env node

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { performance } from 'node:perf_hooks';

const fromUrl = process.env.ROLLBACK_FROM_URL;
const toUrl = process.env.ROLLBACK_TO_URL;

if (!fromUrl || !toUrl) {
    console.error('Faltan variables requeridas: ROLLBACK_FROM_URL y ROLLBACK_TO_URL.');
    process.exit(1);
}

function normalize(url) {
    return url.replace(/\/+$/, '');
}

async function assertStatus(baseUrl, path, expectedStatus) {
    const url = `${baseUrl}${path}`;
    const startedAt = performance.now();
    const response = await fetch(url);
    const durationMs = Number((performance.now() - startedAt).toFixed(2));
    if (response.status !== expectedStatus) {
        const body = await response.text().catch(() => '');
        throw new Error(`[rollback-drill] ${url} esperado ${expectedStatus}, recibido ${response.status}. Body: ${body}`);
    }

    return {
        path,
        expectedStatus,
        actualStatus: response.status,
        durationMs,
    };
}

async function runSmoke(baseUrl) {
    const checks = [];
    checks.push(await assertStatus(baseUrl, '/api/health', 200));
    checks.push(await assertStatus(baseUrl, '/api/studies/biochemist/me', 401));
    return checks;
}

async function run() {
    const current = normalize(fromUrl);
    const rollbackTarget = normalize(toUrl);
    const generatedAt = new Date().toISOString();

    console.log(`[rollback-drill] Validando release actual: ${current}`);
    const currentChecks = await runSmoke(current);
    console.log('[rollback-drill] OK release actual');

    console.log(`[rollback-drill] Validando objetivo de rollback: ${rollbackTarget}`);
    const rollbackChecks = await runSmoke(rollbackTarget);
    console.log('[rollback-drill] OK objetivo rollback');

    const report = {
        generatedAt,
        current,
        rollbackTarget,
        result: 'success',
        checks: {
            current: currentChecks,
            rollbackTarget: rollbackChecks,
        },
    };

    const reportDir = path.join(process.cwd(), 'reports', 'rollback');
    await mkdir(reportDir, { recursive: true });
    const fileStamp = generatedAt.replace(/[:.]/g, '-');
    const reportPath = path.join(reportDir, `rollback-drill-${fileStamp}.json`);
    await writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8');

    console.log('[rollback-drill] DRILL EXITOSO: ambos entornos cumplen checks minimos de salud y guard de autenticacion.');
    console.log(`[rollback-drill] Reporte guardado en: ${reportPath}`);
}

run().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
});
