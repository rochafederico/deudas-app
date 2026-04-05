// test/stats.test.js
// Tests for StatsCard and StatsIndicators components
import { assert } from './setup.js';
import StatsCard from '../src/features/stats/components/StatsCard.js';
import { addValue, compactFormat } from '../src/features/stats/utils/formatCurrency.js';

// ===================================================================
// UC1: StatsCard renders with correct Bootstrap classes
// ===================================================================
async function testStatsCardBootstrapClasses() {
    console.log('  UC1: StatsCard renderiza clases Bootstrap correctas');
    const card = StatsCard({ title: 'Ingresos', items: ['ARS: $ 1,000.00'], color: 'success' });

    assert(card.classList.contains('card'), 'card debe tener clase "card"');
    assert(card.classList.contains('h-100'), 'card debe tener clase "h-100"');
    assert(card.classList.contains('rounded-4'), 'card debe tener clase "rounded-4"');
    assert(card.classList.contains('shadow-sm'), 'card debe tener clase "shadow-sm"');
    assert(card.classList.contains('border-0'), 'card debe tener clase "border-0"');
    assert(card.classList.contains('bg-success-subtle'), 'card debe tener clase "bg-success-subtle"');

    const body = card.querySelector('.card-body');
    assert(body !== null, 'card debe renderizar .card-body');
    assert(body.classList.contains('p-3'), 'body debe tener clase "p-3" para padding');

    const titleEl = body.querySelector('div');
    assert(titleEl !== null, 'card-body debe contener un div de título');
    assert(titleEl.classList.contains('fw-bold'), 'título debe tener clase "fw-bold"');
    assert(titleEl.classList.contains('text-uppercase'), 'título debe tener clase "text-uppercase"');
    assert(titleEl.classList.contains('text-success'), 'título debe tener clase "text-success"');
    assert(titleEl.textContent === 'Ingresos', 'título debe mostrar el texto correcto');
}

// ===================================================================
// UC2: StatsCard renders items with modern typography classes
// ===================================================================
async function testStatsCardItemClasses() {
    console.log('  UC2: StatsCard renderiza items con clases de tipografía modernas');
    const card = StatsCard({ title: 'Gastos', items: ['ARS: $ 500.00', 'USD: -'], color: 'danger' });

    const body = card.querySelector('.card-body');
    assert(body !== null, 'card debe renderizar .card-body');

    const arsEl = body.querySelector('.fs-2');
    assert(arsEl !== null, 'card debe renderizar un elemento con clase "fs-2" para ARS');
    assert(arsEl.classList.contains('kpi-main-value'), 'valor ARS debe tener clase "kpi-main-value" para responsive typography');
    assert(arsEl.classList.contains('fw-bold'), 'valor ARS debe tener clase "fw-bold"');
    assert(arsEl.classList.contains('text-danger'), 'valor ARS debe tener clase "text-danger"');
    assert(arsEl.textContent === 'ARS: $ 500.00', 'valor ARS debe mostrar el texto correcto');

    const usdEl = body.querySelector('.fs-5');
    assert(usdEl !== null, 'card debe renderizar un elemento con clase "fs-5" para USD');
    assert(usdEl.classList.contains('text-muted'), 'valor USD debe tener clase "text-muted"');
    assert(usdEl.textContent === 'USD: -', 'valor USD debe mostrar el texto correcto');
}

// ===================================================================
// UC3: StatsCard renders empty values container when no items
// ===================================================================
async function testStatsCardEmptyItems() {
    console.log('  UC3: StatsCard con lista vacía no muestra valores');
    const card = StatsCard({ title: 'Balance', items: [], color: 'primary' });
    const body = card.querySelector('.card-body');
    assert(body !== null, 'card debe renderizar .card-body incluso sin items');
    assert(body.querySelector('.fs-2') === null, 'card sin items no debe renderizar elemento fs-2 para ARS');
    assert(body.querySelector('.fs-5') === null, 'card sin items no debe renderizar elemento fs-5 para USD');
}

// ===================================================================
// UC4: StatsCard uses default color when none is provided
// ===================================================================
async function testStatsCardDefaultColor() {
    console.log('  UC4: StatsCard usa color "secondary" por defecto');
    const card = StatsCard({ title: 'Test' });
    assert(card.classList.contains('bg-secondary-subtle'), 'card debe tener clase "bg-secondary-subtle" por defecto');
    const body = card.querySelector('.card-body');
    assert(body !== null, 'card debe renderizar .card-body con color por defecto');
    const titleEl = body.querySelector('div');
    assert(titleEl.classList.contains('text-secondary'), 'título debe tener clase "text-secondary" por defecto');
}

// ===================================================================
// UC5: addValue logic — zero values display as "-" without "$" symbol
// ===================================================================
async function testAddValueZeroDisplaysAsDash() {
    console.log('  UC5: addValue muestra "-" para valores cero sin símbolo $');
    const result = addValue({ ARS: 0, USD: 2500 });
    assert(result[0] === 'ARS: -', 'valor 0 debe mostrarse como "ARS: -" sin símbolo $');
    assert(result[1] === 'USD: $ 2,5 mil', 'valor 2500 debe mostrarse como "USD: $ 2,5 mil"');
}

// ===================================================================
// UC6: addValue logic — null/undefined values display as "-"
// ===================================================================
async function testAddValueNullDisplaysAsDash() {
    console.log('  UC6: addValue muestra "-" para valores null o undefined');
    const resultNull = addValue({ ARS: null });
    assert(resultNull[0] === 'ARS: -', 'valor null debe mostrarse como "ARS: -"');
    assert(resultNull[1] === 'USD: -', 'USD ausente debe mostrarse como "USD: -"');

    const resultUndefined = addValue({ USD: undefined });
    assert(resultUndefined[1] === 'USD: -', 'valor undefined debe mostrarse como "USD: -"');

    const resultBoth = addValue({ ARS: null, USD: null });
    assert(resultBoth.every(r => r.endsWith(': -')), 'todos los valores null deben mostrarse como "-"');
}

// ===================================================================
// UC7: addValue always renders both ARS and USD rows
// ===================================================================
async function testAddValueAlwaysShowsBothCurrencies() {
    console.log('  UC7: addValue siempre muestra ARS y USD aunque el objeto esté vacío');

    const resultEmpty = addValue({});
    assert(resultEmpty.length === 2, 'addValue debe retornar siempre 2 filas');
    assert(resultEmpty[0] === 'ARS: -', 'ARS debe mostrarse como "-" cuando no hay datos');
    assert(resultEmpty[1] === 'USD: -', 'USD debe mostrarse como "-" cuando no hay datos');

    const resultNull = addValue(null);
    assert(resultNull.length === 2, 'addValue debe retornar 2 filas cuando obj es null');
    assert(resultNull[0] === 'ARS: -', 'ARS debe mostrarse como "-" cuando obj es null');
    assert(resultNull[1] === 'USD: -', 'USD debe mostrarse como "-" cuando obj es null');
}

// ===================================================================
// UC8: compactFormat — values >= 1.000 display in "mil" format
// ===================================================================
async function testCompactFormatMil() {
    console.log('  UC8: compactFormat muestra formato "mil" para valores >= 1.000');
    assert(compactFormat(850000) === '850 mil', '850000 debe mostrarse como "850 mil"');
    assert(compactFormat(1000) === '1 mil', '1000 debe mostrarse como "1 mil"');
    assert(compactFormat(1200) === '1,2 mil', '1200 debe mostrarse como "1,2 mil"');
    assert(compactFormat(500000) === '500 mil', '500000 debe mostrarse como "500 mil"');
}

// ===================================================================
// UC9: compactFormat — values >= 1.000.000 display in "Millones" format
// ===================================================================
async function testCompactFormatMillones() {
    console.log('  UC9: compactFormat muestra formato "Millones" para valores >= 1.000.000');
    assert(compactFormat(1200000) === '1,2 Millones', '1200000 debe mostrarse como "1,2 Millones"');
    assert(compactFormat(3450000) === '3,45 Millones', '3450000 debe mostrarse como "3,45 Millones"');
    assert(compactFormat(1000000) === '1 Millones', '1000000 debe mostrarse como "1 Millones"');
}

// ===================================================================
// UC10: compactFormat — small values use normal es-AR format
// ===================================================================
async function testCompactFormatSmall() {
    console.log('  UC10: compactFormat usa formato normal para valores < 1.000');
    assert(compactFormat(500) === '500,00', '500 debe mostrarse como "500,00"');
    assert(compactFormat(999) === '999,00', '999 debe mostrarse como "999,00"');
    assert(compactFormat(0) === '0,00', '0 debe mostrarse como "0,00"');
}

// ===================================================================
// UC11: compactFormat — null/undefined returns "-"
// ===================================================================
async function testCompactFormatNull() {
    console.log('  UC11: compactFormat muestra "-" para null o undefined');
    assert(compactFormat(null) === '-', 'null debe retornar "-"');
    assert(compactFormat(undefined) === '-', 'undefined debe retornar "-"');
}

export const tests = [
    testStatsCardBootstrapClasses,
    testStatsCardItemClasses,
    testStatsCardEmptyItems,
    testStatsCardDefaultColor,
    testAddValueZeroDisplaysAsDash,
    testAddValueNullDisplaysAsDash,
    testAddValueAlwaysShowsBothCurrencies,
    testCompactFormatMil,
    testCompactFormatMillones,
    testCompactFormatSmall,
    testCompactFormatNull,
];
