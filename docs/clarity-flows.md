# Microsoft Clarity: eventos y flujos

| Flujo | Evento en Clarity | Tipo |
| --- | --- | --- |
| Crear deuda | `create_debt_started` | Inicio |
| Crear deuda | `create_debt_completed` | Completado |
| Crear deuda | `create_debt_validation_error` | Error |
| Crear deuda | `create_debt_abandoned` | Abandono |
| Editar deuda | `edit_debt_started` | Inicio |
| Editar deuda | `edit_debt_completed` | Completado |
| Editar deuda | `edit_debt_validation_error` | Error |
| Editar deuda | `edit_debt_abandoned` | Abandono |
| Eliminar deuda | `delete_debt_completed` | Completado |
| Duplicar cuota | `duplicate_installment_started` | Inicio |
| Duplicar cuota | `duplicate_installment_completed` | Completado |
| Duplicar cuota | `duplicate_installment_abandoned` | Abandono |
| Registrar pago | `payment_registered` | Completado |
| Registrar pago | `payment_validation_error` | Error |
| Exportar datos | `shortcut_used` (`shortcut=export_data`) | Acceso directo |
| Exportar datos | `export_data_started` | Inicio |
| Exportar datos | `export_data_used` | Ejecución |
| Exportar datos | `export_data_completed` | Completado |
| Exportar datos | `export_data_validation_error` | Error |
| Importar datos | `shortcut_used` (`shortcut=import_data`) | Acceso directo |
| Importar datos | `import_data_started` | Inicio |
| Importar datos | `import_data_used` | Ejecución |
| Importar datos | `import_data_completed` | Completado |
| Importar datos | `import_data_validation_error` | Error |
| Importar datos | `import_data_abandoned` | Abandono |
| Eliminar todo | `shortcut_used` (`shortcut=delete_all_data`) | Acceso directo |
| Tour guiado | `shortcut_used` (`shortcut=tour`) | Acceso directo |
| Tour guiado | `tour_started` | Inicio |
| Tour guiado | `tour_completed` | Completado |
| Tour guiado | `tour_abandoned` | Abandono |
