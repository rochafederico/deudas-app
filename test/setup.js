// test/setup.js
// Shared test infrastructure. DOM globals are set by test/globals.js (loaded via --import).

// Import all shared UI components so they register in customElements
import '../src/components/AppButton.js';
import '../src/components/AppInput.js';
import '../src/components/AppForm.js';
import '../src/components/AppTable.js';
import '../src/components/UiModal.js';

// Track test results
let passed = 0;
let failed = 0;

export function assert(condition, message) {
    if (!condition) {
        console.error('    FAIL:', message);
        failed++;
        return false;
    }
    passed++;
    return true;
}

export function getResults() {
    return { passed, failed };
}

export function printResults() {
    console.log(`\nResults: ${passed} passed, ${failed} failed`);
    if (failed > 0) {
        console.error(`\n${failed} test(s) failed`);
        process.exit(1);
    }
    console.log('\nAll tests passed');
}
