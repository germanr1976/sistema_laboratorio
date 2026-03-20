/**
 * final-readiness.mjs
 *
 * Acta de readiness final — Semana 12
 *
 * Ejecuta en secuencia:
 *   1. Pruebas automatizadas (npm run ci)
 *   2. Simulacro de incidentes (npm run incident:drill)
 *   3. Baseline de performance (npm run perf:baseline)
 *
 * Genera reporte unificado `reports/final-readiness-YYYY-MM-DDTHH-mm-ss.json`
 * con estado Go/No-Go.
 *
 * Uso:
 *   npm run final:readiness
 */

import { execSync } from 'node:child_process';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPORT_DIR = join(__dirname, '..', 'reports', 'final-readiness');

function ts() {
    return new Date().toISOString();
}

function log(level, msg, extra = '') {
    const prefix = { INFO: ' ·', PASS: ' ✔', FAIL: ' ✖', HEAD: '━' }[level] ?? ' ?';
    console.log(`${prefix} [${ts()}] ${msg}${extra ? `  (${extra})` : ''}`);
}

async function runCommand(cmd, label) {
    log('INFO', `${label}...`);
    const start = Date.now();
    try {
        execSync(cmd, { stdio: 'pipe', cwd: __dirname + '/..' });
        const durationMs = Date.now() - start;
        log('PASS', `${label} completado`, `${durationMs}ms`);
        return { success: true, durationMs, error: null };
    } catch (err) {
        const durationMs = Date.now() - start;
        log('FAIL', `${label} falló`, err.message);
        return { success: false, durationMs, error: err.message };
    }
}

async function readLastReport(pattern) {
    try {
        const dirPath = dirname(pattern);
        const prefix = basename(pattern);
        const files = await readdir(dirPath);
        const matching = files.filter(f => f.startsWith(prefix)).sort().reverse();
        if (!matching.length) return null;
        const content = await readFile(join(dirPath, matching[0]), 'utf-8');
        return JSON.parse(content);
    } catch {
        return null;
    }
}

async function run() {
    console.log('\n' + '═'.repeat(70));
    console.log('  ACTA DE READINESS FINAL — Semana 12');
    console.log('  (Validación Go/No-Go antes de producción)');
    console.log('═'.repeat(70) + '\n');

    const checks = {};

    // ── 1. CI (tests) ───────────────────────────────────────────────────────
    log('HEAD', 'FASE 1: Validación de tests (npm run ci)', '');
    checks.ci = await runCommand('npm run ci', 'npm run ci');

    // ── 2. Incident drill ───────────────────────────────────────────────────
    log('HEAD', 'FASE 2: Simulacro de incidentes (npm run incident:drill)', '');
    checks.incidentDrill = await runCommand('npm run incident:drill', 'npm run incident:drill');

    // ── 3. Performance baseline ────────────────────────────────────────────
    log('HEAD', 'FASE 3: Baseline de performance (npm run perf:baseline)', '');
    checks.perfBaseline = await runCommand('npm run perf:baseline', 'npm run perf:baseline');

    // ── Resumen ───────────────────────────────────────────────────────────
    const allPass = Object.values(checks).every(c => c.success);
    const critical = ['ci', 'incidentDrill'];
    const criticalPass = critical.every(key => checks[key].success);
    const goStatus = criticalPass ? 'GO' : 'NO-GO';

    console.log('\n' + '═'.repeat(70));
    console.log('  RESULTADO FINAL');
    console.log('═'.repeat(70));
    console.log(`
  CI (tests).................${checks.ci.success ? '✔ PASS' : '✖ FAIL'} (${checks.ci.durationMs}ms)
  Incident drill.............${checks.incidentDrill.success ? '✔ PASS' : '✖ FAIL'} (${checks.incidentDrill.durationMs}ms)
  Performance baseline.......${checks.perfBaseline.success ? '✔ PASS' : '✖ FAIL'} (${checks.perfBaseline.durationMs}ms)

  CRITERIO GO/NO-GO:
    - CI (tests) debe pasar: ${checks.ci.success ? '✔ SÍ' : '✖ NO'}
    - Incident drill (3 escenarios) debe pasar: ${checks.incidentDrill.success ? '✔ SÍ' : '✖ NO'}
    - Performance baseline es informativo (no bloquea)

  ───────────────────────────────────────────────────────────────────────
  ESTADO FINAL:  ${goStatus === 'GO' ? '🟢 GO' : '🔴 NO-GO'}
  ───────────────────────────────────────────────────────────────────────
`);

    // ── Persistir reporte ────────────────────────────────────────────────
    const reportTs = new Date().toISOString().replace(/[:.]/g, '-');
    const report = {
        acta: 'FINAL-READINESS-SEMANA-12',
        timestamp: new Date().toISOString(),
        goStatus,
        checks,
        summary: {
            ci: checks.ci.success ? 'PASS' : 'FAIL',
            incidentDrill: checks.incidentDrill.success ? 'PASS' : 'FAIL',
            perfBaseline: checks.perfBaseline.success ? 'PASS' : 'INFO',
            overall: criticalPass ? 'GO' : 'NO-GO',
        },
    };

    await mkdir(REPORT_DIR, { recursive: true });
    const reportPath = join(REPORT_DIR, `final-readiness-${reportTs}.json`);
    await writeFile(reportPath, JSON.stringify(report, null, 2));
    console.log(`  Reporte guardado en: ${reportPath}\n`);

    process.exit(criticalPass ? 0 : 1);
}

run().catch(err => {
    console.error('Error crítico en final-readiness:', err);
    process.exit(2);
});
