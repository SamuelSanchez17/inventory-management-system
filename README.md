# StockBeauty - Inventory Management System

<div align="center">

| [🇬🇧 English](README.md) | [🇪🇸 Español](README_ES.md) |
|:---:|:---:|

</div>

---

> A complete and high-performance enterprise solution for comprehensive inventory management, sales processing, and reporting. Developed as a modern desktop application with Tauri and Rust in the backend.

---

## 🎯 Project Overview

StockBeauty is a professional inventory and point-of-sale management system designed to optimize commercial operations. It combines an intuitive user interface with a robust backend that guarantees security, scalability, and performance.

Originally developed as a solution for an enterprise client, this project represents a modern and well-structured architecture, demonstrating full-stack development capabilities, application architecture expertise, and software engineering best practices.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                  PRESENTATION LAYER (Frontend)          │
│     React 19 + Vite | Tailwind CSS | Multi-language     │
│            Component-based | Context API                │
└─────────────────────────┬───────────────────────────────┘
                          │
         ┌────────────────┼────────────────┐
         ▼                ▼                ▼
   ┌──────────┐    ┌─────────────┐  ┌──────────────┐
   │  Pages   │    │ Components/ │  │   Contexts   │
   │  (views) │    │  (modular)  │  │  (global)    │
   └──────────┘    └─────────────┘  └──────────────┘
         │                │                │
         └────────────────┼────────────────┘
                          │
            ┌─────────────▼──────────────┐
            │    IPC (Tauri invoke)      │
            └─────────────┬──────────────┘
                          │
┌─────────────────────────▼──────────────────────────────────┐
│                    LOGIC LAYER (Backend)                   │
│              Rust + Tauri 2.x + SQLite                     │
├────────────────────────────────────────────────────────────┤
│  Commands (IPC) → Services (Business Logic) → Repositories │
│  Validations | Business Rules | Report Generation | Export │
└──────────────────────────┬─────────────────────────────────┘
                           │
              ┌────────────▼────────────┐
              │     SQLite Database     │
              └─────────────────────────┘
```

---

## 🛠️ Technologies Used

### Frontend
![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)
![Vite](https://img.shields.io/badge/Vite-Build%20Tool-brightgreen?style=for-the-badge)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow?style=for-the-badge&logo=javascript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-38-b38?style=for-the-badge&logo=tailwindcss)

### Backend
![Rust](https://img.shields.io/badge/Rust-Programming%20Language-orange?style=for-the-badge&logo=rust)
![Tauri](https://img.shields.io/badge/Tauri-Desktop%20App-teal?style=for-the-badge)
![SQLite](https://img.shields.io/badge/SQLite-Database-lightblue?style=for-the-badge&logo=sqlite)

### Infrastructure
![ESLint](https://img.shields.io/badge/ESLint-Linter-purple?style=for-the-badge)
![Git](https://img.shields.io/badge/Git-Version%20Control-red?style=for-the-badge&logo=git)

---

## ✨ Key Features

### Inventory Management
- **Product Control**: Create, update, delete, and categorize products
- **Dual Pricing**: Separate consultant and public prices
- **Stock Levels**: Real-time inventory monitoring
- **Image Management**: Product images with automatic thumbnails
- **Categorization**: Hierarchical product organization by categories
- **Advanced Search**: Fast and precise filtering with fuzzy search

### Sales System
- **Sales Processing**: Optimized UI for fast transactions
- **Shopping Cart**: Dynamic cart with real-time stock validation
- **Installment Sales**: Support for `Abono` (partial payments) mode
- **Real-Time Validations**: Instant availability verification
- **Transaction History**: Complete traceability of operations
- **User Profile**: Customizable sidebar and visible tools

### Reports & Analytics
- **Executive Dashboard**: Key performance indicator visualization
- **Sales Analysis**: Detailed reports with pagination
- **Expandable Rows**: View sale details inline
- **Payment Tracking**: Monitor installments and pending balances
- **Data Export**: Excel (.xlsx) export functionality
- **Database Backup**: Export/import database backups

### User Experience
- **Responsive Interface**: Adaptation to different screen sizes
- **Customizable Themes**: Light/dark mode with live preview
- **Multi-language Support**: English and Spanish (i18n)
- **Auto-Updates**: Tauri updater integration
- **Intuitive Navigation**: UX optimized for productivity

---

## 💳 Installment Sales Flow (Multiple Payments)

- **Sales flow with multiple payments**: A sale can be created as `Abono` (installment mode), and then paid in variable partial amounts until fully settled.
- **Where the initial payment is recorded**: In the Sales checkout flow when creating the sale with `tipo_pago = Abono`.
- **Where later payments are added**: In Reports, from the Edit Sale modal, where additional payments are registered for the selected sale.
- **KPI meaning (`Sold` vs `Collected`)**: `Sold` is the sum of sales totals in the selected period; `Collected` is the sum of payments actually collected in the selected period (including later payments from previous sales).

### Manual Validation Checklist

1. Create a sale with `tipo_pago = Abono` and enter a valid initial payment.
2. Confirm the sale shows a pending balance and state `Parcial` (or `Pendiente` if initial payment is `0.00`).
3. Open Reports and verify the sale displays `total_venta`, `total_abonado`, `saldo_pendiente`, and `estado_pago`.
4. From the Edit Sale modal in Reports, register an additional valid payment.
5. Verify `total_abonado` increases and `saldo_pendiente` decreases after the new payment.
6. Register final payment up to the remaining balance and confirm state changes to `Liquidada`.
7. Compare KPIs and confirm `Collected` can differ from `Sold` when there are pending balances or late collections.

---

## 📊 Project Structure

```
src/
├── components/              # Modular React components
│   ├── appHeader.jsx      # Top navigation bar
│   ├── header.jsx         # Page headers
│   ├── profileModal.jsx   # User profile management
│   ├── sidebar.jsx        # Collapsible navigation
│   ├── updateModal.jsx    # Auto-update dialogs
│   ├── products/          # Product modals (extracted)
│   │   ├── index.js
│   │   ├── CreateProductModal.jsx
│   │   ├── EditProductModal.jsx
│   │   ├── DeleteProductModal.jsx
│   │   └── DeleteCategoryModal.jsx
│   ├── reports/           # Report components (extracted)
│   │   ├── SaleRow.jsx
│   │   ├── ReportsEditSaleModal.jsx
│   │   ├── ReportsDeleteSaleModal.jsx
│   │   ├── ReportsExportSection.jsx
│   │   └── ReportsItemsModal.jsx
│   ├── sales/            # Sales panels (extracted)
│   │   ├── SalesCatalogPanel.jsx
│   │   ├── SalesCartPanel.jsx
│   │   └── SalesCheckoutPanel.jsx
│   └── configuration/
│       └── ImportConfirmModal.jsx
├── pages/                 # Main application views
│   ├── dashboard.jsx      # KPI dashboard with charts
│   ├── products.jsx      # Product & category management
│   ├── sales.jsx         # Point of sale interface
│   ├── reports.jsx       # Sales reports & analytics
│   └── configuration.jsx  # App settings & preferences
├── context/               # Global state management
│   ├── LanguageContext.jsx
│   └── ThemeContext.jsx
├── utils/                 # Utility functions
│   ├── fuzzySearch.js     # Fuzzy search algorithm
│   └── pricing.js         # Price calculations
├── styles/                # CSS modules by page
├── translations.js        # i18n strings (en/es)
└── App.jsx               # Root component

src-tauri/
├── src/
│   ├── commands/         # IPC commands exposed to frontend
│   ├── services/         # Business logic layer
│   ├── repos/            # Data access layer
│   ├── models.rs         # Data structures
│   ├── database.rs       # DB connection & management
│   └── main.rs           # Entry point
└── tauri.conf.json       # Tauri configuration

esquemaDB.sql              # Database schema
```

---

## 🎨 Interface & UX

### Main Modules

**Dashboard**
- Key Performance Indicators (KPIs): total stock, low stock alerts
- Sales charts with top products visualization
- Low inventory product list with pagination
- Quick access to management functions

**Product Management**
- Interactive table with pagination and fuzzy search
- Category CRUD with inline editing
- Dual pricing: consultant and public prices
- Image upload with automatic thumbnail generation
- Product creation, editing, and deletion modals

**Point of Sale**
- Three-panel layout: catalog, cart, checkout
- Real-time stock validation
- Support for `Abono` (installment) payments with initial payment
- Automatic price calculations and totals
- Client name/lastname capture for sales records

**Reports**
- Paginated sales table with expandable rows
- Payment status tracking (Liquidada, Parcial, Pendiente)
- Edit sale details inline from reports
- Register additional payments for installment sales
- Edit sale items (add, remove, update products)
- Export to Excel (.xlsx) and database backup

---

## 🔐 Technical Highlights

### Architecture & Patterns
- **Modular Components**: UI extracted into reusable components with barrel exports
- **Context API**: Global state for theme and language
- **Service Pattern**: Backend organized in Commands → Services → Repositories
- **Repository Pattern**: Clean separation of data access logic

### Frontend Quality
- **React 19**: Latest React with hooks optimization
- **Tailwind CSS**: Utility-first styling with CVA
- **ESLint + Prettier**: Code quality and consistency
- **Fuzzy Search**: Levenshtein-based product search

### Backend Robustness
- **Rust Performance**: Native compilation, memory safety
- **Tauri 2**: Secure IPC, native OS integration
- **SQLite**: Reliable embedded database
- **Serde**: Efficient serialization/deserialization

### Desktop Features
- **Auto-Updates**: Tauri updater with background download
- **File Dialogs**: Natclearive file picker for import/export
- **Window Management**: Custom window controls

---

## 📸 Screenshots Gallery

> [Screenshots will be added soon, showcasing the dashboard interface, product management, and reports]


---

## 👨‍💻 About This Project

**Developer**: Samuel Sánchez Guzmán  
**Type**: Desktop Application  
**Status**: Production  
**Version**: 1.5.1  
**Last Updated**: April 2026  

---

**© 2026 StockBeauty - Inventory Management System. All rights reserved.**
