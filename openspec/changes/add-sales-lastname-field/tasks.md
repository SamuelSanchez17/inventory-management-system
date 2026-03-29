# Tasks: Agregar campo apellido(s) al registrar venta

## Phase 1: Contrato y validaciones base

- [x] 1.1 Extender `VentaCompletaInput` en `src-tauri/src/models.rs` agregando `apellido_clienta`.
- [x] 1.2 Actualizar `create_venta_completa` en `src-tauri/src/commands/sales.rs` para validar y componer nombre completo.

## Phase 2: UI de registro de venta

- [x] 2.1 Añadir estado/input de apellido(s) en `src/pages/sales.jsx`.
- [x] 2.2 Actualizar validaciones de checkout para requerir nombre y apellido(s).
- [x] 2.3 Incluir `apellido_clienta` en el payload enviado a `create_venta_completa`.
- [x] 2.4 Limpiar el nuevo campo al completar la venta.

## Phase 3: i18n

- [x] 3.1 Agregar nuevas claves de idioma para etiqueta y placeholder de apellido(s) en `src/translations.js` (es/en).
- [x] 3.2 Agregar toast de validación para apellido obligatorio en `src/translations.js` (es/en).

## Phase 4: Verificación

- [x] 4.1 Ejecutar lint frontend para detectar regresiones.
- [x] 4.2 Ejecutar build frontend y check/compilación Rust para validar integración.
- [x] 4.3 Documentar resultados en `verify-report.md`.
