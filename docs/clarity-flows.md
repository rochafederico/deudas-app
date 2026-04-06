# Microsoft Clarity: eventos y flujos

| Flujo | Eventos en Clarity |
| --- | --- |
| Crear deuda | `create_debt_started`, `create_debt_completed`, `create_debt_validation_error`, `create_debt_abandoned` |
| Editar deuda | `edit_debt_started`, `edit_debt_completed`, `edit_debt_validation_error`, `edit_debt_abandoned` |
| Eliminar deuda | `delete_debt_completed` |
| Duplicar cuota | `duplicate_installment_started`, `duplicate_installment_completed`, `duplicate_installment_abandoned` |
| Registrar pago | `payment_registered`, `payment_validation_error` |
| Exportar datos | `shortcut_used` (`shortcut=export_data`), `export_data_started`, `export_data_used`, `export_data_completed`, `export_data_validation_error` |
| Importar datos | `shortcut_used` (`shortcut=import_data`), `import_data_started`, `import_data_used`, `import_data_completed`, `import_data_validation_error`, `import_data_abandoned` |
| Eliminar todo | `shortcut_used` (`shortcut=delete_all_data`) |
| Tour guiado | `shortcut_used` (`shortcut=tour`), `tour_started`, `tour_completed`, `tour_abandoned` |
