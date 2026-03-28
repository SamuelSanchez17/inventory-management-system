# Design: Agregar apellido(s) en registro de venta

## Technical Approach

Se extenderá el formulario de checkout para capturar apellido(s) y el contrato de comando `create_venta_completa` para recibirlo. El backend compondrá el nombre completo y usará el flujo actual de persistencia para evitar cambios en esquema, repositorio, reportes y exportación.

## Architecture Decisions

### Decision: Mantener columna única `nombre_clienta`

**Choice**: Guardar nombre+apellido(s) concatenado en la columna existente.
**Alternatives considered**: Agregar columna nueva `apellido_clienta` en `ventas` con migración.
**Rationale**: Menor riesgo y cero impacto en consultas/reportes/export actuales.

### Decision: Validación dual en frontend y backend

**Choice**: Validar apellido(s) obligatorio en `sales.jsx` y normalizar nuevamente en comando Rust.
**Alternatives considered**: Validar solo en frontend.
**Rationale**: Defensa en profundidad ante llamadas directas al comando.

## Data Flow

Formulario ventas -> payload `create_venta_completa` (nombre + apellido) -> comando Rust concatena -> `VentaService.create_venta` -> `ventas.nombre_clienta`

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/pages/sales.jsx` | Modify | Estado nuevo, input apellido, validación y envío de payload |
| `src/translations.js` | Modify | Etiquetas/placeholders y toast de apellido en ES/EN |
| `src-tauri/src/models.rs` | Modify | Campo `apellido_clienta` en `VentaCompletaInput` |
| `src-tauri/src/commands/sales.rs` | Modify | Composición/validación de nombre completo antes de crear venta |

## Interfaces / Contracts

```rust
pub struct VentaCompletaInput {
    pub fecha: String,
    pub nombre_clienta: String,
    pub apellido_clienta: String,
    pub tipo_pago: TipoPago,
    pub productos: Vec<ItemVenta>,
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| UI | Validación de apellido obligatorio | Revisión manual de flujo de checkout |
| Backend command | Composición de nombre completo | Build/check y prueba manual registrando venta |
| Integration | Flujo de registro completo | Ejecutar app y verificar venta creada correctamente |

## Migration / Rollout

No migration required.

## Open Questions

- [ ] Ninguna bloqueante.
