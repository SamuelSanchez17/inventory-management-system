# Delta for Sales

## ADDED Requirements

### Requirement: Captura obligatoria de apellido(s) en checkout

The system MUST solicitar `apellido(s)` en el formulario de registro de venta y no permitir enviar la venta cuando dicho campo esté vacío.

#### Scenario: Registro válido con nombre y apellido

- GIVEN una usuaria en la pantalla de ventas con al menos un producto en carrito
- WHEN captura nombre, apellido(s), fecha válida y tipo de pago, y presiona pagar
- THEN la venta se envía al backend sin error
- AND el payload incluye `apellido_clienta`

#### Scenario: Apellido(s) vacío

- GIVEN una usuaria con carrito con productos
- WHEN intenta pagar sin capturar apellido(s)
- THEN el sistema bloquea el envío
- AND muestra un mensaje de validación

### Requirement: Persistencia compatible del nombre de clienta

The system SHALL combinar `nombre_clienta` y `apellido_clienta` para persistir en el campo actual `ventas.nombre_clienta` sin romper consultas existentes.

#### Scenario: Persistencia en campo legado

- GIVEN un request de `create_venta_completa` con nombre y apellido(s)
- WHEN el backend crea la venta
- THEN guarda un único string con el nombre completo en `nombre_clienta`
- AND las lecturas de ventas existentes continúan funcionando

## MODIFIED Requirements

### Requirement: Validación de identidad de clienta en alta de venta

The system MUST validar que tanto nombre como apellido(s) no sean vacíos previo al registro.
(Previously: solo se validaba `nombre_clienta`)

#### Scenario: Falta nombre

- GIVEN una usuaria con carrito con productos
- WHEN intenta pagar sin nombre
- THEN la venta no se envía
- AND se muestra mensaje de nombre obligatorio
