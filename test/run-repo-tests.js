// test/run-repo-tests.js
// Main test runner — imports setup (happy-dom + fake-indexeddb) and runs
// all feature test suites. Each test file is organized by E2E use cases
// that go from UI components down to the repository/DB layer.
import { initDB } from '../src/shared/database/initDB.js';
import { printResults } from './setup.js';
import { tests as deudasTests } from './deudas.test.js';

async function run() {
    try {
        await initDB();
        console.log('DB initialized (happy-dom + fake-indexeddb)\n');

        console.log('--- Deudas ---');
        for (const test of deudasTests) { await test(); }

        printResults();
        process.exit(0);
    } catch (err) {
        console.error('Test run failed:', err);
        process.exit(1);
    }
}

run();
