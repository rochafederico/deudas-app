// src/database/seedDemo.js
import { DEUDAS_STORE, MONTOS_STORE } from './schema.js';
import { getDB } from './initDB.js';
import { DeudaEntity } from '../entity/DeudaEntity.js';
import { MontoEntity } from '../entity/MontoEntity.js';

export async function seedDemo(db) {
    const transaction = db.transaction([DEUDAS_STORE, MONTOS_STORE], 'readwrite');
    const deudasStore = transaction.objectStore(DEUDAS_STORE);
    const montosStore = transaction.objectStore(MONTOS_STORE);
    const countRequest = deudasStore.count();
    return new Promise((resolve, reject) => {
        countRequest.onsuccess = async () => {
            if (countRequest.result > 0) {
                resolve('Ya existen datos, no se cargó demo');
                return;
            }
            // Seed demo
            const demoDeudas = [
                new DeudaEntity({
                    acreedor: 'Visa BBVA Francés',
                    tipoDeuda: 'Tarjeta de crédito',
                    notas: 'Ejemplo de tarjeta Visa BBVA Francés'
                }),
                new DeudaEntity({
                    acreedor: 'Juli',
                    tipoDeuda: 'Alquiler',
                    notas: 'Ejemplo de alquiler con 6 cuotas'
                }),
                new DeudaEntity({
                    acreedor: 'Personal',
                    tipoDeuda: 'Servicio',
                    notas: 'Ejemplo de servicio de Personal'
                })
            ];
            const demoMontos = [
                // Visa BBVA Francés
                new MontoEntity({ deudaId: null, monto: 1000000, moneda: 'ARS', vencimiento: '2025-07-10' }),
                new MontoEntity({ deudaId: null, monto: 100, moneda: 'USD', vencimiento: '2025-07-10' }),
                // Alquiler: 6 montos, vencen el 5 de cada mes desde julio a diciembre 2025
                new MontoEntity({ deudaId: null, monto: 468964, moneda: 'ARS', vencimiento: '2025-07-05' }),
                new MontoEntity({ deudaId: null, monto: 468964, moneda: 'ARS', vencimiento: '2025-08-05' }),
                new MontoEntity({ deudaId: null, monto: 468964, moneda: 'ARS', vencimiento: '2025-09-05' }),
                new MontoEntity({ deudaId: null, monto: 468964, moneda: 'ARS', vencimiento: '2025-10-05' }),
                new MontoEntity({ deudaId: null, monto: 468964, moneda: 'ARS', vencimiento: '2025-11-05' }),
                new MontoEntity({ deudaId: null, monto: 468964, moneda: 'ARS', vencimiento: '2025-12-05' }),
                // Personal
                new MontoEntity({ deudaId: null, monto: 22758, moneda: 'ARS', vencimiento: '2025-08-21' })
            ];
            // Insert deudas y montos
            const deudaIds = [];
            for (let i = 0; i < demoDeudas.length; i++) {
                const req = deudasStore.add(demoDeudas[i]);
                await new Promise((res, rej) => {
                    req.onsuccess = () => { deudaIds[i] = req.result; res(); };
                    req.onerror = () => rej();
                });
            }
            // Asignar deudaId correcto a cada monto
            demoMontos[0].deudaId = deudaIds[0]; // Visa ARS
            demoMontos[1].deudaId = deudaIds[0]; // Visa USD
            demoMontos[2].deudaId = deudaIds[1]; // Alquiler julio
            demoMontos[3].deudaId = deudaIds[1]; // Alquiler agosto
            demoMontos[4].deudaId = deudaIds[1]; // Alquiler septiembre
            demoMontos[5].deudaId = deudaIds[1]; // Alquiler octubre
            demoMontos[6].deudaId = deudaIds[1]; // Alquiler noviembre
            demoMontos[7].deudaId = deudaIds[1]; // Alquiler diciembre
            demoMontos[8].deudaId = deudaIds[2]; // Personal
            for (const m of demoMontos) {
                montosStore.add(m);
            }
            resolve('Demo cargado');
        };
        countRequest.onerror = (event) => {
            reject('Error contando deudas: ' + event.target.errorCode);
        };
    });
}
