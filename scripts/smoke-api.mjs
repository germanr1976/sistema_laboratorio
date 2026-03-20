const baseUrl = (process.env.SMOKE_BASE_URL || 'http://localhost:3000').replace(/\/+$/, '');

async function assertStatus(path, expectedStatus) {
    const url = `${baseUrl}${path}`;
    const response = await fetch(url);

    if (response.status !== expectedStatus) {
        const body = await response.text().catch(() => '');
        throw new Error(`Smoke failed for ${path}: expected ${expectedStatus}, got ${response.status}. Body: ${body}`);
    }

    return response;
}

async function run() {
    console.log(`[smoke] Running against ${baseUrl}`);

    await assertStatus('/api/health', 200);
    await assertStatus('/api/studies/biochemist/me', 401);

    console.log('[smoke] OK: health and auth guards validated');
}

run().catch((error) => {
    console.error('[smoke] ERROR:', error.message);
    process.exit(1);
});
