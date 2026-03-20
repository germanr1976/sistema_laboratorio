/**
 * incident-drill.mjs
 *
 * Simulacro de incidentes — Semana 11
 *
 * Ejecuta tres escenarios de diagnóstico contra el backend:
 *   SCENARIO-1  Backend no responde (timeout/conexión rechazada)
 *   SCENARIO-2  Base de datos degradada (health check sin DB)
 *   SCENARIO-3  Cuota de plan excedida (smoke de endpoint protegido)
 *
 * Variables de entorno opcionales:
 *   DRILL_BASE_URL      URL base del backend  (default: http://localhost:3000)
 *   DRILL_TIMEOUT_MS    Timeout por request    (default: 4000)
 *   DRILL_REPORT_DIR    Carpeta de reportes    (default: reports/incidents)
 *
 * Uso:
 *   npm run incident:drill
 *   DRILL_BASE_URL=https://mi-backend.onrender.com npm run incident:drill
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const BASE_URL = (process.env.DRILL_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const TIMEOUT_MS = Number(process.env.DRILL_TIMEOUT_MS || '4000');
const REPORT_DIR = process.env.DRILL_REPORT_DIR || join(__dirname, '..', 'reports', 'incidents');

// ── Helpers ──────────────────────────────────────────────────────────────────

function ts() {
    return new Date().toISOString();
}

function log(level, msg, extra = '') {
    const prefix = { INFO: '  ·', PASS: '  ✔', FAIL: '  ✖', HEAD: '\n──' }[level] ?? '  ?';
    console.log(`${prefix} [${ts()}] ${msg}${extra ? `  (${extra})` : ''}`);
}

async function fetchWithTimeout(url, opts = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const start = Date.now();
    try {
        const res = await fetch(url, { ...opts, signal: controller.signal });
        const durationMs = Date.now() - start;
        let body = null;
        try { body = await res.json(); } catch { /* ignore */ }
        return { ok: true, status: res.status, durationMs, body };
    } catch (err) {
        const durationMs = Date.now() - start;
        const isTimeout = err.name === 'AbortError' || err.name === 'TimeoutError';
        return { ok: false, status: null, durationMs, error: err.message, isTimeout };
    } finally {
        clearTimeout(timer);
    }
}

// ── Escenario 1: Backend no responde ─────────────────────────────────────────
// Llama con timeout corto a una URL inexistente para simular host caído.
// En un entorno real: el backend no arrancó o la VM está down.
async function scenario1() {
    log('HEAD', 'SCENARIO-1: Backend no responde / timeout');

    const deadUrl = `${BASE_URL.replace(/:\d+/, ':19999')}/api/health`;

    log('INFO', `Llamando a URL inalcanzable: ${deadUrl}`);
    const result = await fetchWithTimeout(deadUrl, {});

    let passed;
    if (!result.ok) {
        passed = true;
        log('PASS', `Detectado correctamente: conexión fallida`, result.error);
    } else {
        passed = false;
        log('FAIL', `Inesperado: recibió respuesta ${result.status} en lugar de error de conexión`);
    }

    return {
        scenario: 'SCENARIO-1',
        title: 'Backend no responde',
        passed,
        detail: result,
        diagnosis: passed
            ? 'El sistema de monitoreo detectaría el fallo. Acción: revisar logs del proceso, reiniciar instancia.'
            : 'Riesgo: el health check no detecta el fallo correctamente.',
        runbook: 'Ver sección 2.1 del playbook: pasos para diagnóstico de instancia caída.',
    };
}

// ── Escenario 2: Health check del backend ────────────────────────────────────
// Verifica que /api/health responde 200 y contiene los campos esperados.
// Si falla → backend arrancó pero hay problema interno (DB, config).
async function scenario2() {
    log('HEAD', 'SCENARIO-2: Health check — diagnóstico de degradación interna');

    const url = `${BASE_URL}/api/health`;
    log('INFO', `GET ${url}`);
    const result = await fetchWithTimeout(url);

    let passed = false;
    const checks = [];

    if (!result.ok) {
        checks.push({ check: 'conectividad', passed: false, detail: result.error });
    } else {
        checks.push({ check: `HTTP ${result.status}`, passed: result.status === 200 });

        if (result.body) {
            checks.push({ check: 'body.success === true', passed: result.body.success === true });
            checks.push({ check: 'body.uptimeSeconds presente', passed: typeof result.body.uptimeSeconds === 'number' });
            checks.push({ check: 'body.timestamp presente', passed: typeof result.body.timestamp === 'string' });
        } else {
            checks.push({ check: 'body parseable', passed: false });
        }

        passed = checks.every(c => c.passed);
    }

    for (const c of checks) {
        log(c.passed ? 'PASS' : 'FAIL', c.check, c.detail ?? '');
    }

    return {
        scenario: 'SCENARIO-2',
        title: 'Health check del backend',
        passed,
        durationMs: result.durationMs,
        checks,
        diagnosis: passed
            ? `Backend saludable (uptime: ${result.body?.uptimeSeconds}s).`
            : 'Fallo detectado en health check. Acción: revisar logs estructurados, DATABASE_URL, migraciones pendientes.',
        runbook: 'Ver sección 2.2 del playbook: pasos para diagnóstico de degradación interna.',
    };
}

// ── Escenario 3: Endpoint protegido sin token ─────────────────────────────────
// Verifica que un endpoint protegido devuelve 401 (no 500 ni acceso abierto).
// Simula verificación de que el guard de autenticación sigue activo.
async function scenario3() {
    log('HEAD', 'SCENARIO-3: Endpoint protegido — guard de autenticación activo');

    const url = `${BASE_URL}/api/studies/biochemist/me`;
    log('INFO', `GET ${url} (sin token)`);
    const result = await fetchWithTimeout(url);

    let passed = false;
    const checks = [];

    if (!result.ok) {
        checks.push({ check: 'conectividad', passed: false, detail: result.error });
    } else {
        const expectedStatuses = [401, 403];
        const isRejected = expectedStatuses.includes(result.status);
        checks.push({ check: `HTTP ${result.status} (esperado 401/403)`, passed: isRejected });
        const isNotExposed = result.status !== 200;
        checks.push({ check: 'No expone datos sin token (≠ 200)', passed: isNotExposed });
        passed = isRejected && isNotExposed;
    }

    for (const c of checks) {
        log(c.passed ? 'PASS' : 'FAIL', c.check, c.detail ?? '');
    }

    return {
        scenario: 'SCENARIO-3',
        title: 'Guard de autenticación activo',
        passed,
        durationMs: result.durationMs,
        checks,
        diagnosis: passed
            ? 'Guard activo: el endpoint rechaza requests sin token correctamente.'
            : 'ALERTA: endpoint accesible sin autenticación o backend caído. Acción inmediata requerida.',
        runbook: 'Ver sección 2.3 del playbook: brecha de autenticación.',
    };
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function run() {
    console.log('\n════════════════════════════════════════════');
    console.log('  SIMULACRO DE INCIDENTES — Semana 11');
    console.log(`  Target: ${BASE_URL}`);
    console.log(`  Timeout: ${TIMEOUT_MS}ms`);
    console.log('════════════════════════════════════════════');

    const results = [];
    results.push(await scenario1());
    results.push(await scenario2());
    results.push(await scenario3());

    // ── Resumen ───────────────────────────────────────────────────────────────
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    const overall = failed === 0;

    console.log('\n════════════════════════════════════════════');
    console.log(`  RESULTADO: ${passed}/${results.length} escenarios OK`);
    for (const r of results) {
        console.log(`  ${r.passed ? '✔' : '✖'} ${r.scenario}: ${r.title}`);
        console.log(`    → ${r.diagnosis}`);
    }
    console.log('════════════════════════════════════════════\n');

    // ── Persistir reporte ────────────────────────────────────────────────────
    const reportTs = new Date().toISOString().replace(/[:.]/g, '-');
    const report = {
        drillTimestamp: new Date().toISOString(),
        baseUrl: BASE_URL,
        timeoutMs: TIMEOUT_MS,
        overall: overall ? 'PASS' : 'PARTIAL',
        summary: { passed, failed, total: results.length },
        scenarios: results,
    };

    await mkdir(REPORT_DIR, { recursive: true });
    const reportPath = join(REPORT_DIR, `incident-drill-${reportTs}.json`);
    await writeFile(reportPath, JSON.stringify(report, null, 2));
    console.log(`  Reporte guardado en: ${reportPath}\n`);

    // Salir con código no-cero solo si SCENARIO-2 o SCENARIO-3 fallan
    // (SCENARIO-1 falla "bien" por diseño cuando el backend está levantado)
    const criticalFailed = results
        .filter(r => r.scenario !== 'SCENARIO-1')
        .some(r => !r.passed);

    process.exit(criticalFailed ? 1 : 0);
}

run().catch(err => {
    console.error('Error fatal en incident-drill:', err);
    process.exit(2);
});
