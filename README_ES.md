# StockBeauty - Sistema de Gestión de Inventario

<div align="center">

| [🇬🇧 English](README.md) | [🇪🇸 Español](README_ES.md) |
|:---:|:---:|

</div>

---

> Una solución empresarial completa y de alto rendimiento para la gestión integral de inventario, procesamiento de ventas y reportes. Desarrollada como aplicación de escritorio moderna con Tauri y Rust en el backend.

---

## 🎯 Descripción del Proyecto

StockBeauty es un sistema profesional de gestión de inventario y punto de venta diseñado para optimizar operaciones comerciales. Combina una interfaz de usuario intuitiva con un backend robusto que garantiza seguridad, escalabilidad y rendimiento.

Desarrollado inicialmente como solución para un cliente empresarial, este proyecto representa una arquitectura moderna y bien estructurada, demostrando capacidades en desarrollo full-stack, arquitectura de aplicaciones y mejores prácticas de ingeniería de software.

---

## 🏗️ Arquitectura General

```
┌─────────────────────────────────────────────────────────────┐
│                 CAPA DE PRESENTACIÓN (Frontend)             │
│       React 19 + Vite | Tailwind CSS | Multiidioma          │
│              Basado en componentes | Context API            │
└─────────────────────────┬───────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
    ┌──────────┐   ┌─────────────┐  ┌──────────────┐
    │ Páginas  │   │ Componentes │  │  Contextos   │
    │ (vistas) │   │  Modulares  │  │   Globales   │
    └──────────┘   └─────────────┘  └──────────────┘
          │               │               │
          └───────────────┼───────────────┘
                          │
            ┌─────────────▼──────────────┐
            │    IPC (Tauri invoke)      │
            └─────────────┬──────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                    CAPA DE LÓGICA (Backend)                 │
│                Rust + Tauri 2.x + SQLite                    │
├─────────────────────────────────────────────────────────────┤
│   Commands (IPC) → Services (Lógica) → Repositories         │
│   Validaciones | Reglas de Negocio | Reportes | Exportación │
└──────────────────────────┬──────────────────────────────────┘
                           │
              ┌────────────▼────────────┐
              │   Base de Datos SQLite  │
              └─────────────────────────┘
```

---

## 🛠️ Tecnologías Utilizadas

### Frontend
![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)
![Vite](https://img.shields.io/badge/Vite-Build%20Tool-brightgreen?style=for-the-badge)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow?style=for-the-badge&logo=javascript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-38--b38?style=for-the-badge&logo=tailwindcss)

### Backend
![Rust](https://img.shields.io/badge/Rust-Programming%20Language-orange?style=for-the-badge&logo=rust)
![Tauri](https://img.shields.io/badge/Tauri-Desktop%20App-teal?style=for-the-badge)
![SQLite](https://img.shields.io/badge/SQLite-Database-lightblue?style=for-the-badge&logo=sqlite)

### Infraestructura
![ESLint](https://img.shields.io/badge/ESLint-Linter-purple?style=for-the-badge)
![Git](https://img.shields.io/badge/Git-Version%20Control-red?style=for-the-badge&logo=git)

---

## ✨ Características Principales

### Gestión de Inventario
- **Control de Productos**: Crear, actualizar, eliminar y categorizar productos
- **Precios Dobles**: Precios separados para consultoras y público
- **Niveles de Stock**: Monitoreo en tiempo real del inventario
- **Gestión de Imágenes**: Imágenes de productos con miniaturas automáticas
- **Categorización**: Organización jerárquica de productos por categorías
- **Búsqueda Avanzada**: Filtros rápidos y precisos con búsqueda difusa

### Sistema de Ventas
- **Procesamiento de Ventas**: Interfaz optimizada para transacciones rápidas
- **Carrito de Compras**: Carrito dinámico con validación de stock en tiempo real
- **Ventas con Abonos**: Soporte para pagos parciales (`Abono`)
- **Validaciones en Tiempo Real**: Verificación instantánea de disponibilidad
- **Historial de Transacciones**: Trazabilidad completa de operaciones
- **Perfil de Usuario**: Barra lateral personalizable según el flujo de trabajo

### Reportes y Análisis
- **Dashboard Ejecutivo**: Visualización de indicadores clave de rendimiento
- **Análisis de Ventas**: Reportes detallados con paginación
- **Filas Expandibles**: Ver detalles de venta en línea
- **Seguimiento de Pagos**: Monitoreo de abonos y saldos pendientes
- **Exportación de Datos**: Funcionalidad de exportación a Excel (.xlsx)
- **Respaldo de Base de Datos**: Exportar/importar respaldos de BD

### Experiencia de Usuario
- **Interfaz Responsiva**: Adaptación a diferentes tamaños de pantalla
- **Temas Personalizables**: Modo claro/oscuro con vista previa en vivo
- **Multiidioma**: Soporte para inglés y español (i18n)
- **Actualizaciones Automáticas**: Integración con Tauri updater
- **Navegación Intuitiva**: UX optimizada para productividad

---

## 💳 Flujo de Ventas con Abonos Múltiples

- **Flujo de ventas con abonos múltiples**: Una venta puede crearse como `Abono` y pagarse en montos parciales variables hasta quedar liquidada.
- **Dónde se registra el abono inicial**: En el checkout de Ventas al crear la venta con `tipo_pago = Abono`.
- **Dónde se agregan abonos posteriores**: En Reportes, desde el modal de Editar Venta, registrando abonos adicionales de la venta seleccionada.
- **Significado de KPI (`Vendido` vs `Cobrado`)**: `Vendido` es la suma de totales de venta del período seleccionado; `Cobrado` es la suma de abonos efectivamente cobrados en ese período (incluye cobros posteriores de ventas anteriores).

### Checklist de Validación Manual

1. Crea una venta con `tipo_pago = Abono` e ingresa un abono inicial válido.
2. Confirma que la venta quede con saldo pendiente y estado `Parcial` (o `Pendiente` si el abono inicial es `0.00`).
3. Abre Reportes y verifica que la venta muestre `total_venta`, `total_abonado`, `saldo_pendiente` y `estado_pago`.
4. Desde el modal Editar Venta en Reportes, registra un abono adicional válido.
5. Verifica que `total_abonado` aumente y `saldo_pendiente` disminuya tras el nuevo abono.
6. Registra un último abono hasta cubrir el saldo y confirma que el estado cambie a `Liquidada`.
7. Compara KPIs y confirma que `Cobrado` puede diferir de `Vendido` cuando existen saldos pendientes o cobros tardíos.

---

## 📊 Estructura del Proyecto

```
src/
├── components/              # Componentes React modulares
│   ├── appHeader.jsx      # Barra de navegación superior
│   ├── header.jsx         # Encabezados de página
│   ├── profileModal.jsx   # Gestión de perfil de usuario
│   ├── sidebar.jsx        # Navegación colapsable
│   ├── updateModal.jsx    # Diálogos de actualización
│   ├── products/          # Modales de productos (extraídos)
│   │   ├── index.js
│   │   ├── CreateProductModal.jsx
│   │   ├── EditProductModal.jsx
│   │   ├── DeleteProductModal.jsx
│   │   └── DeleteCategoryModal.jsx
│   ├── reports/           # Componentes de reportes (extraídos)
│   │   ├── SaleRow.jsx
│   │   ├── ReportsEditSaleModal.jsx
│   │   ├── ReportsDeleteSaleModal.jsx
│   │   ├── ReportsExportSection.jsx
│   │   └── ReportsItemsModal.jsx
│   ├── sales/            # Paneles de ventas (extraídos)
│   │   ├── SalesCatalogPanel.jsx
│   │   ├── SalesCartPanel.jsx
│   │   └── SalesCheckoutPanel.jsx
│   └── configuration/
│       └── ImportConfirmModal.jsx
├── pages/                 # Vistas principales de la aplicación
│   ├── dashboard.jsx      # Dashboard con KPIs y gráficos
│   ├── products.jsx      # Gestión de productos y categorías
│   ├── sales.jsx         # Interfaz de punto de venta
│   ├── reports.jsx       # Reportes y análisis de ventas
│   └── configuration.jsx  # Configuración de la app
├── context/               # Gestión de estado global
│   ├── LanguageContext.jsx
│   └── ThemeContext.jsx
├── utils/                 # Funciones utilitarias
│   ├── fuzzySearch.js     # Algoritmo de búsqueda difusa
│   └── pricing.js         # Cálculos de precios
├── styles/                # Módulos CSS por página
├── translations.js         # Cadenas i18n (en/es)
└── App.jsx               # Componente raíz

src-tauri/
├── src/
│   ├── commands/         # Comandos IPC expuestos al frontend
│   ├── services/         # Capa de lógica de negocio
│   ├── repos/            # Capa de acceso a datos
│   ├── models.rs         # Estructuras de datos
│   ├── database.rs       # Conexión y gestión BD
│   └── main.rs           # Punto de entrada
└── tauri.conf.json       # Configuración de Tauri

esquemaDB.sql              # Esquema de base de datos
```

---

## 🎨 Interfaz y UX

### Módulos Principales

**Dashboard**
- Indicadores clave de desempeño (KPIs): stock total, alertas de bajo inventario
- Gráficos de ventas con visualización de productos top
- Lista de productos con inventario bajo con paginación
- Acceso rápido a funciones de gestión

**Gestión de Productos**
- Tabla interactiva con paginación y búsqueda difusa
- CRUD de categorías con edición en línea
- Precios dobles: consultoras y público
- Carga de imágenes con generación automática de miniaturas
- Modales de creación, edición y eliminación de productos

**Punto de Venta**
- Diseño de tres paneles: catálogo, carrito, checkout
- Validación de stock en tiempo real
- Soporte para pagos `Abono` (abonos) con pago inicial
- Cálculos automáticos de precios y totales
- Captura de nombre/apellido del cliente para registros de venta

**Reportes**
- Tabla de ventas paginada con filas expandibles
- Seguimiento de estado de pago (Liquidada, Parcial, Pendiente)
- Edición de detalles de venta en línea desde reportes
- Registro de abonos adicionales para ventas con pagos parciales
- Edición de productos de venta (agregar, eliminar, actualizar)
- Exportación a Excel (.xlsx) y respaldo de base de datos

---

## 🔐 Características Técnicas Destacadas

### Arquitectura y Patrones
- **Componentes Modulares**: UI extraída en componentes reutilizables con exports de barril
- **Context API**: Estado global para tema e idioma
- **Patrón de Servicio**: Backend organizado en Commands → Services → Repositories
- **Patrón Repository**: Separación clara de lógica de acceso a datos

### Calidad Frontend
- **React 19**: Última versión de React con optimización de hooks
- **Tailwind CSS**: Estilos utility-first con CVA
- **ESLint + Prettier**: Calidad y consistencia del código
- **Búsqueda Difusa**: Búsqueda de productos basada en Levenshtein

### Robustez del Backend
- **Rendimiento Rust**: Compilación nativa, seguridad de memoria
- **Tauri 2**: IPC seguro, integración nativa con SO
- **SQLite**: Base de datos embebida confiable
- **Serde**: Serialización/deserialización eficiente

### Características de Escritorio
- **Actualizaciones Automáticas**: Tauri updater con descarga en segundo plano
- **Diálogos de Archivo**: Selector nativo de archivos para importar/exportar
- **Gestión de Ventanas**: Controles personalizados de ventana

---

## 📸 Galería de Pantallas

> [Las capturas de pantalla serán añadidas próximamente, mostrando la interfaz del dashboard, gestión de productos y reportes]


---

## 👨‍💻 Acerca Del Proyecto

**Desarrollador**: Samuel Sánchez Guzmán  
**Tipo**: Aplicación de Escritorio  
**Estado**: Producción  
**Versión**: 1.5.1  
**Última Actualización**: Abril 2026  

---

**© 2026 StockBeauty - Sistema de Gestión de Inventario. Todos los derechos reservados.**
