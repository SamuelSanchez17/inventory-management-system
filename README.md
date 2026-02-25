# StockBeauty - Sistema de Gestión de Inventario

> Una solución empresarial completa y performante para la gestión integral de inventario, ventas y reportes. Desarrollada como aplicación de escritorio moderna con Tauri y Rust en el backend.

---

## 🎯 Descripción del Proyecto

StockBeauty es un sistema profesional de gestión de inventario y punto de venta diseñado para optimizar operaciones comerciales. Combina una interfaz de usuario intuitiva con un backend robusto que garantiza seguridad, escalabilidad y rendimiento.

Desarrollado inicialmente como solución para un cliente empresarial, este proyecto representa una arquitectura moderna y bien estructurada, demostrando capacidades en desarrollo full-stack, arquitectura de aplicaciones y mejores prácticas de ingeniería de software.

---

## 🏗️ Arquitectura General

```
┌─────────────────────────────────────────────────────┐
│          CAPA DE PRESENTACIÓN (Frontend)            │
│  React + Vite | Temas dinámicos | Multiidioma       │
└────────────────────┬────────────────────────────────┘
                     │
          ┌──────────┴──────────┐
          ▼                     ▼
    ┌─────────────┐      ┌──────────────┐
    │  Componentes│      │  Contextos   │
    │  Modulares  │      │  Globales    │
    └─────────────┘      └──────────────┘
          │                     │
          └──────────┬──────────┘
                     │
     ┌───────────────┴────────────────┐
     │  IPC Communication (Tauri)     │
     └───────────┬────────────────────┘
                 │
┌────────────────▼─────────────────────┐
│      CAPA DE LÓGICA (Backend)        │
│   Rust + Tauri + SQLite              │
├──────────────────────────────────────┤
│ • Servicios de Negocio               │
│ • Repositorios de Datos              │
│ • Validaciones y Reglas              │
│ • Exportación de Reportes            │
└────────────────┬─────────────────────┘
                 │
     ┌───────────▼─────────────┐
     │   Base de Datos SQLite  │
     └─────────────────────────┘
```

---

## 🛠️ Tecnologías Utilizadas

### Frontend
![React](https://img.shields.io/badge/React-18-blue?style=for-the-badge&logo=react)
![Vite](https://img.shields.io/badge/Vite-Build%20Tool-brightgreen?style=for-the-badge)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow?style=for-the-badge&logo=javascript)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3)

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
- **Niveles de Stock**: Monitoreo en tiempo real de inventario
- **Categorización**: Organización jerárquica de producto por categorías
- **Búsqueda Avanzada**: Filtros rápidos y precisos

### Sistema de Ventas
- **Procesamiento de Ventas**: Interfaz optimizada para transacciones rápidas
- **Validaciones en Tiempo Real**: Verificación de disponibilidad instantánea
- **Historial de Transacciones**: Trazabilidad completa de operaciones
- **Perfil de Usuario**: El usuario puede adaptar la barra lateral y las herramientas visibles según su flujo de trabajo.

### Reportes y Analytics
- **Dashboard Ejecutivo**: Visualización de KPIs principales
- **Análisis de Ventas**: Reportes detallados y comparativos
- **Exportación de Datos**: Generación de reportes en múltiples formatos
- **Gráficos Interactivos**: Información visual y accesible

### Experiencia de Usuario
- **Interfaz Responsiva**: Adaptación a diferentes tamaños de pantalla
- **Temas Personalizables**: Modo claro/oscuro según preferencia
- **Multiidioma**: Soporte para múltiples lenguajes (i18n)
- **Navegación Intuitiva**: UX optimizada para productividad

---

## 📊 Estructura del Proyecto

```
src/
├── components/          # Componentes React reutilizables
│   ├── header.jsx      # Cabecera principal
│   ├── sidebar.jsx     # Navegación lateral
│   └── updateModal.jsx # Modal de actualizaciones
├── pages/              # Vistas principales de la aplicación
│   ├── dashboard.jsx   # Panel de control
│   ├── products.jsx    # Gestión de productos
│   ├── sales.jsx       # Procesamiento de ventas
│   ├── reports.jsx     # Análisis y reportes
│   └── configuration.jsx # Configuraciones
├── context/            # Context API para estado global
│   ├── LanguageContext.jsx
│   └── ThemeContext.jsx
├── services/           # Servicios y lógica
├── styles/             # Estilos CSS por módulo
├── translations.js     # Configuración multiidioma
└── App.jsx            # Componente principal

src-tauri/
├── src/
│   ├── commands/       # Comandos IPC expuestos al frontend
│   │   ├── products.rs
│   │   ├── sales.rs
│   │   ├── categories.rs
│   │   └── export.rs
│   ├── services/       # Lógica de negocio
│   │   ├── producto_service.rs
│   │   ├── venta_service.rs
│   │   └── categoria_service.rs
│   ├── repos/          # Capa de acceso a datos
│   │   ├── producto_repo.rs
│   │   ├── venta_repo.rs
│   │   └── categoria_repo.rs
│   ├── models.rs       # Estructuras de datos
│   ├── database.rs     # Conexión y gestión BD
│   └── main.rs         # Punto de entrada

esquemaDB.sql          # Esquema de base de datos
```

---

## 🎨 Interfaz y UX

### Módulos Principales

**Dashboard**
- Indicadores clave de desempeño (KPIs)
- Gráficos de tendencias de ventas
- Alertas de bajo inventario
- Accesos rápidos a funciones comunes

**Gestión de Productos**
- Tabla interactiva con paginación
- Búsqueda y filtros avanzados
- Edición en línea con validaciones
- Importación/Exportación de datos

**Punto de Venta**
- Interfaz optimizada para transacciones rápidas
- Carrito de compras dinámico
- Cálculos automáticos
- Generación de recibos

**Reportes**
- Múltiples vistas de análisis
- Filtros por período, categoría, vendedor
- Gráficos comparativos
- Exportación en PDF/Excel

---

## 🔐 Características Técnicas Destacadas

### Backend Robusto
- Arquitectura en capas: Commands → Services → Repositories
- Validación de datos en múltiples niveles
- Manejo seguro de operaciones de base de datos
- Serialización eficiente de datos con Serde

### Rendimiento
- Aplicación de escritorio nativa (Tauri)
- Compilación a código máquina (Rust)
- IPC de bajo overhead
- Consultas optimizadas a base de datos

### Mantenibilidad
- Código modular y bien estructurado
- Separación clara de responsabilidades
- Patrones establecidos (Service Pattern, Repository Pattern)
- Fácil extensibilidad para nuevas funcionalidades

---

## 📸 Galería de Pantallas

> [Las capturas de pantalla serán añadidas próximamente, mostrando la interfaz del dashboard, gestión de productos y reportes]

---

## 📝 Notas

Este proyecto fue desarrollado originalmente como solución empresarial personalizada. La decisión de compartir esta arquitectura busca demostrar:

- Dominio de arquitecturas full-stack
- Implementación de patrones de diseño profesionales
- Capacidad de integración entre tecnologías complementarias
- Atención al detalle en UX/UI
- Escritura de código limpio y escalable

---

## 👨‍💻 Acerca Del Proyecto

**Desarrollador**: Samuel Sánchez Guzmán  
**Tipo**: Aplicación Desktop  
**Estado**: Producción  
**Última Actualización**: Febrero 2026  

---

**© 2026 StockBeauty. Todos los derechos reservados.**
