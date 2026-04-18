import { assert } from './setup.js';

export const tests = [
    async function appForm_rendersRequiredIndicatorsAndNativeAttributes() {
        console.log('  AppForm: renders required indicators and native validation attributes');
        const appForm = document.createElement('app-form');
        appForm.fields = [
            { name: 'acreedor', type: 'text', label: 'Acreedor', required: true },
            { name: 'monto', type: 'number', label: 'Monto', required: true, min: 0.01 },
            { name: 'moneda', type: 'select', label: 'Moneda', options: ['ARS', 'USD'], required: true, placeholder: 'Seleccioná una moneda…' }
        ];
        document.body.appendChild(appForm);

        const labels = appForm.querySelectorAll('.form-label');
        assert(labels[0].textContent.includes('Acreedor'), 'Debe renderizar el label Acreedor');
        assert(labels[0].querySelector('.text-danger') !== null, 'Debe mostrar asterisco en campo requerido');

        const select = appForm.querySelector('select[name="moneda"]');
        const montoInput = appForm.querySelector('input[name="monto"]');
        assert(select !== null, 'Debe renderizar el select requerido');
        assert(select.options[0].value === '', 'El select requerido debe tener opción placeholder vacía');
        assert(select.options[0].textContent === 'Seleccioná una moneda…', 'El placeholder del select debe coincidir');
        assert(montoInput.getAttribute('min') === '0.01', 'El input numérico debe exponer min nativo');
        assert(montoInput.required === true, 'El input numérico debe usar required nativo');

        document.body.removeChild(appForm);
    },

    async function appForm_invalidSubmitUsesNativeHtmlValidation() {
        console.log('  AppForm: invalid submit relies on native HTML validation');
        const appForm = document.createElement('app-form');
        appForm.fields = [
            { name: 'acreedor', type: 'text', label: 'Acreedor', required: true },
            { name: 'monto', type: 'number', label: 'Monto', required: true, min: 0.01 },
            { name: 'moneda', type: 'select', label: 'Moneda', options: ['ARS', 'USD'], required: true, placeholder: 'Seleccioná una moneda…' }
        ];
        document.body.appendChild(appForm);

        const form = appForm.querySelector('form');
        const montoInput = appForm.querySelector('input[name="monto"]');
        const acreedorInput = appForm.querySelector('input[name="acreedor"]');
        const monedaSelect = appForm.querySelector('select[name="moneda"]');
        let submitEvent = null;
        appForm.addEventListener('form:submit', e => { submitEvent = e; });
        montoInput.value = '0';

        appForm.triggerSubmit();

        assert(submitEvent === null, 'No debe emitir form:submit si el formulario es inválido');
        assert(form.classList.contains('was-validated'), 'El formulario debe usar la clase de Bootstrap tras un intento inválido');
        assert(acreedorInput.validity.valueMissing === true, 'Acreedor debe quedar inválido por required nativo');
        assert(montoInput.validity.rangeUnderflow === true, 'Monto debe quedar inválido por min nativo');
        assert(monedaSelect.validity.valueMissing === true, 'Moneda debe quedar inválida por required nativo');
        assert(!acreedorInput.classList.contains('is-invalid'), 'No debe inyectar clases is-invalid manuales');

        document.body.removeChild(appForm);
    },

    async function appForm_validSubmitEmitsFormSubmit() {
        console.log('  AppForm: valid submit emits form:submit with values');
        const appForm = document.createElement('app-form');
        appForm.fields = [
            { name: 'acreedor', type: 'text', label: 'Acreedor', required: true },
            { name: 'moneda', type: 'select', label: 'Moneda', options: ['ARS', 'USD'], required: true, placeholder: 'Seleccioná una moneda…' }
        ];
        document.body.appendChild(appForm);

        const acreedorInput = appForm.querySelector('input[name="acreedor"]');
        const monedaSelect = appForm.querySelector('select[name="moneda"]');
        let submitEvent = null;
        appForm.addEventListener('form:submit', e => { submitEvent = e; });

        acreedorInput.value = 'Banco Galicia';
        monedaSelect.value = 'ARS';
        appForm.triggerSubmit();

        assert(submitEvent !== null, 'Debe emitir form:submit cuando el formulario es válido');
        assert(submitEvent.detail.acreedor === 'Banco Galicia', 'Debe incluir acreedor en el payload');
        assert(submitEvent.detail.moneda === 'ARS', 'Debe incluir moneda en el payload');

        document.body.removeChild(appForm);
    },

    async function appForm_hiddenButtonsCanStillSubmitValidForm() {
        console.log('  AppForm: triggerSubmit works when buttons are hidden');
        const appForm = document.createElement('app-form');
        appForm.fields = [
            { name: 'acreedor', type: 'text', label: 'Acreedor', required: true }
        ];
        appForm.hideButtons = true;
        document.body.appendChild(appForm);

        const input = appForm.querySelector('input[name="acreedor"]');
        const hiddenSubmit = appForm.querySelector('[data-programmatic-submit="true"]');
        let submitEvent = null;
        appForm.addEventListener('form:submit', e => { submitEvent = e; });

        assert(hiddenSubmit !== null, 'Debe renderizar un submit programático oculto cuando hideButtons=true');

        input.value = 'Banco Galicia';
        appForm.triggerSubmit();

        assert(submitEvent !== null, 'Debe emitir form:submit aunque los botones visibles estén ocultos');
        assert(submitEvent.detail.acreedor === 'Banco Galicia', 'Debe incluir el valor del campo asociado al formulario');

        document.body.removeChild(appForm);
    },

    async function appForm_clearValidationStateRemovesBootstrapValidationClass() {
        console.log('  AppForm: clearValidationState removes stale Bootstrap validation state');
        const appForm = document.createElement('app-form');
        appForm.fields = [
            { name: 'acreedor', type: 'text', label: 'Acreedor', required: true }
        ];
        document.body.appendChild(appForm);

        const form = appForm.querySelector('form');
        appForm.triggerSubmit();
        assert(form.classList.contains('was-validated'), 'El formulario debe quedar validado tras un envío inválido');

        appForm.clearValidationState();

        assert(!form.classList.contains('was-validated'), 'clearValidationState debe limpiar la clase was-validated');

        document.body.removeChild(appForm);
    }
];
