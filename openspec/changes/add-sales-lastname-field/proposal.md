# Proposal: Agregar campo apellido(s) al registrar venta

## Intent

Actualmente el alta de venta solo pide nombre, fecha y tipo de pago. Se requiere capturar apellido(s) de la clienta durante el checkout para mejorar identificación del registro sin alterar el comportamiento de reportes y edición existentes.

## Scope

### In Scope
- Agregar input de apellido(s) en formulario de checkout en ventas.
- Validar que nombre y apellido(s) no estén vacíos antes de registrar.
- Enviar el apellido al backend y persistir un nombre completo en el campo actual `nombre_clienta` para mantener compatibilidad.
- Actualizar textos de i18n en español e inglés.

### Out of Scope
- Rediseñar el modelo de datos para separar nombre/apellido en columnas nuevas.
- Cambiar pantallas de reportes/edición para dividir nombre y apellido en campos distintos.

## Approach

Se añadirá `apellido_clienta` al payload de `create_venta_completa`. El backend unirá `nombre_clienta` + `apellido_clienta` y guardará el resultado en `ventas.nombre_clienta`. Con esto no se modifica contrato de lectura de ventas ni exportación.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/pages/sales.jsx` | Modified | Nuevo estado/input para apellido, validación y payload actualizado |
| `src/translations.js` | Modified | Nuevas claves de etiqueta/placeholder/toast para apellido |
| `src-tauri/src/models.rs` | Modified | `VentaCompletaInput` incorpora `apellido_clienta` |
| `src-tauri/src/commands/sales.rs` | Modified | Se compone `nombre_clienta` completo al crear la venta |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Ruptura de contrato al crear venta | Low | Mantener estructura existente y solo extender input de venta completa |
| Datos con espacios dobles o vacíos | Medium | Normalizar y validar trim de nombre/apellido |

## Rollback Plan

Revertir cambios en `sales.jsx`, `translations.js`, `models.rs` y `commands/sales.rs`, volviendo al payload y validación original sin apellido.

## Dependencies

- Sin dependencias externas nuevas.

## Success Criteria

- [ ] El formulario de ventas muestra campo de apellido(s).
- [ ] No se permite guardar venta si falta nombre o apellido(s).
- [ ] `create_venta_completa` registra venta correctamente con nombre completo.
- [ ] Build y lint de frontend/backend pasan sin errores nuevos.
