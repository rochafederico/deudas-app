// src/shared/database/localStorageFallback.js
// Fallback de persistencia cuando IndexedDB no está disponible.
// Jerarquía: localStorage → memoria de sesión (si LS también falla, ej. Safari privado).

const LS_PREFIX = 'nivva_';
const _mem = {}; // in-memory backing de último recurso

function _ls() {
    try {
        const ls = globalThis.localStorage;
        if (!ls) return null;
        ls.setItem('__nivva_chk', '1');
        ls.removeItem('__nivva_chk');
        return ls;
    } catch {
        return null;
    }
}

const LS = _ls(); // null si localStorage no está disponible

function _load(name) {
    if (LS) {
        try {
            return JSON.parse(LS.getItem(LS_PREFIX + name) || '[]');
        } catch {
            return [];
        }
    }
    return _mem[name] ? [..._mem[name]] : [];
}

function _save(name, data) {
    if (LS) {
        try {
            LS.setItem(LS_PREFIX + name, JSON.stringify(data));
            return;
        } catch {
            // quota excedida — caer a memoria
        }
    }
    _mem[name] = data;
}

function _nextId(name) {
    const key = LS_PREFIX + name + '_seq';
    if (LS) {
        try {
            const n = parseInt(LS.getItem(key) || '0', 10) + 1;
            LS.setItem(key, String(n));
            return n;
        } catch { /* fall through */ }
    }
    const mk = name + '_seq';
    _mem[mk] = (_mem[mk] || 0) + 1;
    return _mem[mk];
}

// Imita la interfaz de un IDBRequest: onsuccess/onerror se asignan sincrónicamente
// y el callback se dispara en el siguiente macrotask (igual que IDB real).
class FakeRequest {
    constructor(fn) {
        this.result = undefined;
        this.onsuccess = null;
        this.onerror = null;
        setTimeout(() => {
            try {
                this.result = fn();
                if (typeof this.onsuccess === 'function') {
                    this.onsuccess({ target: this });
                }
            } catch (e) {
                if (typeof this.onerror === 'function') {
                    this.onerror({ target: { errorCode: e.message } });
                }
            }
        }, 0);
    }
}

class FakeObjectStore {
    constructor(name) {
        this._name = name;
    }

    add(entity) {
        return new FakeRequest(() => {
            const data = _load(this._name);
            const copy = { ...entity };
            if (copy.id == null) copy.id = _nextId(this._name);
            data.push(copy);
            _save(this._name, data);
            return copy.id;
        });
    }

    put(entity) {
        return new FakeRequest(() => {
            const data = _load(this._name);
            const copy = { ...entity };
            if (copy.id == null) copy.id = _nextId(this._name);
            const idx = data.findIndex(r => r.id === copy.id);
            if (idx >= 0) data[idx] = copy;
            else data.push(copy);
            _save(this._name, data);
            return copy.id;
        });
    }

    get(id) {
        return new FakeRequest(() => _load(this._name).find(r => r.id === id));
    }

    delete(id) {
        return new FakeRequest(() => {
            _save(this._name, _load(this._name).filter(r => r.id !== id));
        });
    }

    getAll() {
        return new FakeRequest(() => _load(this._name));
    }

    getAllKeys() {
        return new FakeRequest(() => _load(this._name).map(r => r.id));
    }

    clear() {
        return new FakeRequest(() => { _save(this._name, []); });
    }

    // Convención: 'by_campo' → filtra por record.campo
    index(indexName) {
        const field = indexName.replace(/^by_/, '');
        const name = this._name;
        return {
            getAll(key) {
                return new FakeRequest(() => {
                    const data = _load(name);
                    return key !== undefined ? data.filter(r => r[field] === key) : data;
                });
            },
            getAllKeys(key) {
                return new FakeRequest(() => {
                    const data = _load(name);
                    const filtered = key !== undefined ? data.filter(r => r[field] === key) : data;
                    return filtered.map(r => r.id);
                });
            }
        };
    }
}

class FakeTransaction {
    constructor(storeMap) {
        this._storeMap = storeMap;
        this.onerror = null;
    }
    objectStore(name) {
        return this._storeMap[name];
    }
}

export class FakeIDB {
    constructor() {
        this._stores = {};
        ['deudas', 'montos', 'ingresos', 'inversiones'].forEach(n => {
            this._stores[n] = new FakeObjectStore(n);
        });
    }
    transaction(storeNames) {
        const names = Array.isArray(storeNames) ? storeNames : [storeNames];
        const map = {};
        names.forEach(n => { map[n] = this._stores[n]; });
        return new FakeTransaction(map);
    }
}
