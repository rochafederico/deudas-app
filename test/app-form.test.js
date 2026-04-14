import { assert } from './setup.js';

export const tests = [
    async function appForm_rendersRequiredIndicatorsAndSelectPlaceholder() {
        console.log('  AppForm: renders required indicators and select placeholders');
        const appForm = document.createElement('app-form');
        appForm.fields = [
            { name: 'acreedor', type: 'text', label: 'Acreedor', required: true },
            { name: 'moneda', type: 'select', label: 'Moneda', options: ['ARS', 'USD'], required: true, placeholder: 'Seleccioná una moneda…', requiredMessage: 'Seleccioná una moneda.' }
        ];
        document.body.appendChild(appForm);

        const labels = appForm.querySelectorAll('.form-label');
        assert(labels[0].textContent.includes('Acreedor'), 'Debe renderizar el label Acreedor');
        assert(labels[0].querySelector('.text-danger') !== null, 'Debe mostrar asterisco en campo requerido');

        const select = appForm.querySelector('select[name="moneda"]');
        assert(select !== null, 'Debe renderizar el select requerido');
        assert(select.options[0].value === '', 'El select requerido debe tener opción placeholder vacía');
        assert(select.options[0].textContent === 'Seleccioná una moneda…', 'El placeholder del select debe coincidir');

        document.body.removeChild(appForm);
    },

    async function appForm_submitInvalidShowsSpecificMessagesAndFocusesFirstError() {
        console.log('  AppForm: invalid submit highlights fields, shows messages and focuses first error');
        const appForm = document.createElement('app-form');
        appForm.fields = [
            { name: 'acreedor', type: 'text', label: 'Acreedor', required: true },
            { name: 'monto', type: 'number', label: 'Monto', required: true, min: 0.01, minMessage: 'Ingresá un monto mayor a 0.' },
            { name: 'moneda', type: 'select', label: 'Moneda', options: ['ARS', 'USD'], required: true, placeholder: 'Seleccioná una moneda…', requiredMessage: 'Seleccioná una moneda.' }
        ];
        document.body.appendChild(appForm);

        const form = appForm.querySelector('form');
        const montoInput = appForm.querySelector('input[name="monto"]');
        montoInput.value = '0';

        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

        const acreedorInput = appForm.querySelector('input[name="acreedor"]');
        const monedaSelect = appForm.querySelector('select[name="moneda"]');
        const acreedorError = appForm.querySelector('[data-error-for="acreedor"]');
        const montoError = appForm.querySelector('[data-error-for="monto"]');
        const monedaError = appForm.querySelector('[data-error-for="moneda"]');

        assert(acreedorInput.classList.contains('is-invalid'), 'Acreedor debe quedar marcado como inválido');
        assert(montoInput.classList.contains('is-invalid'), 'Monto debe quedar marcado como inválido');
        assert(monedaSelect.classList.contains('is-invalid'), 'Moneda debe quedar marcada como inválida');
        assert(acreedorError.textContent === 'El campo Acreedor es obligatorio.', 'Debe mostrar mensaje específico para campo requerido');
        assert(montoError.textContent === 'Ingresá un monto mayor a 0.', 'Debe mostrar mensaje específico para monto > 0');
        assert(monedaError.textContent === 'Seleccioná una moneda.', 'Debe mostrar mensaje específico para selección requerida');
        assert(document.activeElement === acreedorInput, 'El foco debe moverse al primer campo con error');

        document.body.removeChild(appForm);
    },

    async function appForm_clearsErrorsWhenFieldIsCorrected() {
        console.log('  AppForm: clears field errors when corrected');
        const appForm = document.createElement('app-form');
        appForm.fields = [
            { name: 'acreedor', type: 'text', label: 'Acreedor', required: true },
            { name: 'monto', type: 'number', label: 'Monto', required: true, min: 0.01, minMessage: 'Ingresá un monto mayor a 0.' },
            { name: 'moneda', type: 'select', label: 'Moneda', options: ['ARS', 'USD'], required: true, placeholder: 'Seleccioná una moneda…', requiredMessage: 'Seleccioná una moneda.' }
        ];
        document.body.appendChild(appForm);

        const form = appForm.querySelector('form');
        const acreedorInput = appForm.querySelector('input[name="acreedor"]');
        const montoInput = appForm.querySelector('input[name="monto"]');
        const monedaSelect = appForm.querySelector('select[name="moneda"]');

        montoInput.value = '0';
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

        acreedorInput.value = 'Banco Galicia';
        acreedorInput.dispatchEvent(new Event('input', { bubbles: true }));
        montoInput.value = '1500';
        montoInput.dispatchEvent(new Event('input', { bubbles: true }));
        monedaSelect.value = 'ARS';
        monedaSelect.dispatchEvent(new Event('change', { bubbles: true }));

        assert(!acreedorInput.classList.contains('is-invalid'), 'Acreedor debe limpiar el estado inválido al corregirse');
        assert(!montoInput.classList.contains('is-invalid'), 'Monto debe limpiar el estado inválido al corregirse');
        assert(!monedaSelect.classList.contains('is-invalid'), 'Moneda debe limpiar el estado inválido al corregirse');
        assert(appForm.querySelector('[data-error-for="acreedor"]').textContent === '', 'Debe limpiar el mensaje de Acreedor');
        assert(appForm.querySelector('[data-error-for="monto"]').textContent === '', 'Debe limpiar el mensaje de Monto');
        assert(appForm.querySelector('[data-error-for="moneda"]').textContent === '', 'Debe limpiar el mensaje de Moneda');

        document.body.removeChild(appForm);
    }
];
