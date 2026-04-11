// test/run-repo-tests.js
// Main test runner — imports setup (happy-dom + fake-indexeddb) and runs
// all feature test suites. Each test file is organized by E2E use cases
// that go from UI components down to the repository/DB layer.
import { initDB } from '../src/shared/database/initDB.js';
import { printResults } from './setup.js';
import { tests as deudasTests } from './deudas.test.js';
import { tests as montosTests } from './montos.test.js';
import { tests as ingresosTests } from './ingresos.test.js';
import { tests as inversionesTests } from './inversiones.test.js';
import { tests as importExportTests } from './import-export.test.js';
import { tests as bootstrapStylesTests } from './bootstrap-styles.test.js';
import { tests as tourTests } from './tour.test.js';
import { tests as notificationsTests } from './notifications.test.js';
import { tests as statsTests } from './stats.test.js';
import { tests as monthFilterTests } from './month-filter.test.js';
import { tests as analyticsTests } from './analytics.test.js';
import { tests as feedbackTests } from './feedback.test.js';

async function run() {
    try {
        await initDB();
        console.log('DB initialized (happy-dom + fake-indexeddb)\n');

        console.log('--- Deudas ---');
        for (const test of deudasTests) { await test(); }

        console.log('\n--- Montos ---');
        for (const test of montosTests) { await test(); }

        console.log('\n--- Ingresos ---');
        for (const test of ingresosTests) { await test(); }

        console.log('\n--- Inversiones ---');
        for (const test of inversionesTests) { await test(); }

        console.log('\n--- Import/Export ---');
        for (const test of importExportTests) { await test(); }

        console.log('\n--- Bootstrap styles ---');
        for (const test of bootstrapStylesTests) { await test(); }

        console.log('\n--- Tour ---');
        for (const test of tourTests) { await test(); }

        console.log('\n--- Notifications ---');
        for (const test of notificationsTests) { await test(); }

        console.log('\n--- Stats ---');
        for (const test of statsTests) { await test(); }

        console.log('\n--- Month Filter ---');
        for (const test of monthFilterTests) { await test(); }

        console.log('\n--- Analytics ---');
        for (const test of analyticsTests) { await test(); }

        console.log('\n--- Feedback ---');
        for (const test of feedbackTests) { await test(); }

        printResults();
        process.exit(0);
    } catch (err) {
        console.error('Test run failed:', err);
        process.exit(1);
    }
}

run();
