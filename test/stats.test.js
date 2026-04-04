// test/stats.test.js
// Tests for StatsCard and StatsIndicators components
import { assert } from './setup.js';
import StatsCard from '../src/features/stats/components/StatsCard.js';

// Mirrors the addValue logic from StatsIndicators to test it in isolation
function makeAddValue() {
    const format = n => n == null ? '-' : n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return (obj) => Object.entries(obj || {}).map(([moneda, monto]) => {
        const val = (monto == null || monto === 0) ? '-' : `$ ${format(monto)}`;
        return `${moneda}: ${val}`;
    });
}

// ===================================================================
// UC1: StatsCard renders with correct Bootstrap classes
// ===================================================================
async function testStatsCardBootstrapClasses() {
    console.log('  UC1: StatsCard renderiza clases Bootstrap correctas');
    const card = StatsCard({ title: 'Ingresos', items: ['ARS: $ 1,000.00'], color: 'success' });

    assert(card.classList.contains('card'), 'card debe tener clase "card"');
    assert(card.classList.contains('h-100'), 'card debe tener clase "h-100"');
    assert(card.classList.contains('border-success'), 'card debe tener clase "border-success"');

    const header = card.querySelector('.card-header');
    assert(header !== null, 'card debe renderizar .card-header');
    assert(header.classList.contains('bg-success'), 'header debe tener clase "bg-success"');
    assert(header.classList.contains('py-1'), 'header debe tener clase "py-1" para padding compacto');
    assert(header.classList.contains('px-2'), 'header debe tener clase "px-2" para padding compacto');
    assert(header.textContent === 'Ingresos', 'header debe mostrar el título');

    const ul = card.querySelector('ul');
    assert(ul !== null, 'card debe renderizar ul');
    assert(ul.classList.contains('list-group'), 'ul debe tener clase "list-group"');
    assert(ul.classList.contains('list-group-flush'), 'ul debe tener clase "list-group-flush"');
}

// ===================================================================
// UC2: StatsCard renders items with compact classes
// ===================================================================
async function testStatsCardItemClasses() {
    console.log('  UC2: StatsCard renderiza items con clases compactas');
    const card = StatsCard({ title: 'Gastos', items: ['ARS: $ 500.00', 'USD: -'], color: 'danger' });

    const items = card.querySelectorAll('li');
    assert(items.length === 2, 'card debe renderizar 2 items');

    const li = items[0];
    assert(li.classList.contains('list-group-item'), 'li debe tener clase "list-group-item"');
    assert(li.classList.contains('border-0'), 'li debe tener clase "border-0"');
    assert(li.classList.contains('py-1'), 'li debe tener clase "py-1" para padding compacto');
    assert(li.classList.contains('px-2'), 'li debe tener clase "px-2" para padding compacto');
    assert(li.classList.contains('small'), 'li debe tener clase "small" para texto compacto');
    assert(li.classList.contains('text-danger'), 'li debe tener clase "text-danger"');
    assert(li.textContent === 'ARS: $ 500.00', 'item debe mostrar el texto correcto');
}

// ===================================================================
// UC3: StatsCard renders empty list when no items
// ===================================================================
async function testStatsCardEmptyItems() {
    console.log('  UC3: StatsCard con lista vacía no muestra items');
    const card = StatsCard({ title: 'Balance', items: [], color: 'primary' });
    const items = card.querySelectorAll('li');
    assert(items.length === 0, 'card sin items no debe renderizar li elementos');
}

// ===================================================================
// UC4: StatsCard uses default color when none is provided
// ===================================================================
async function testStatsCardDefaultColor() {
    console.log('  UC4: StatsCard usa color "secondary" por defecto');
    const card = StatsCard({ title: 'Test' });
    assert(card.classList.contains('border-secondary'), 'card debe tener clase "border-secondary" por defecto');
    const header = card.querySelector('.card-header');
    assert(header.classList.contains('bg-secondary'), 'header debe tener clase "bg-secondary" por defecto');
}

// ===================================================================
// UC5: addValue logic — zero values display as "-" without "$" symbol
// ===================================================================
async function testAddValueZeroDisplaysAsDash() {
    console.log('  UC5: addValue muestra "-" para valores cero sin símbolo $');
    const addValue = makeAddValue();
    const result = addValue({ ARS: 0, USD: 2500 });
    assert(result[0] === 'ARS: -', 'valor 0 debe mostrarse como "ARS: -" sin símbolo $');
    assert(result[1] === 'USD: $ 2,500.00', 'valor positivo debe mostrarse con símbolo $');
}

// ===================================================================
// UC6: addValue logic — null/undefined values display as "-"
// ===================================================================
async function testAddValueNullDisplaysAsDash() {
    console.log('  UC6: addValue muestra "-" para valores null o undefined');
    const addValue = makeAddValue();
    const resultNull = addValue({ ARS: null });
    assert(resultNull[0] === 'ARS: -', 'valor null debe mostrarse como "ARS: -"');

    const resultUndefined = addValue({ USD: undefined });
    assert(resultUndefined[0] === 'USD: -', 'valor undefined debe mostrarse como "USD: -"');

    const resultBoth = addValue({ ARS: null, USD: null });
    assert(resultBoth.every(r => r.endsWith(': -')), 'todos los valores null deben mostrarse como "-"');
}

export const tests = [
    testStatsCardBootstrapClasses,
    testStatsCardItemClasses,
    testStatsCardEmptyItems,
    testStatsCardDefaultColor,
    testAddValueZeroDisplaysAsDash,
    testAddValueNullDisplaysAsDash,
];
