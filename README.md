# StockBeauty - Inventory Management System

> A complete and high-performance enterprise solution for comprehensive inventory management, sales processing, and reporting. Developed as a modern desktop application with Tauri and Rust in the backend.

---

## 🎯 Project Overview

StockBeauty is a professional inventory and point-of-sale management system designed to optimize commercial operations. It combines an intuitive user interface with a robust backend that guarantees security, scalability, and performance.

Originally developed as a solution for an enterprise client, this project represents a modern and well-structured architecture, demonstrating full-stack development capabilities, application architecture expertise, and software engineering best practices.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│       PRESENTATION LAYER (Frontend)                 │
│  React + Vite | Dynamic Themes | Multi-language     │
└────────────────────┬────────────────────────────────┘
                     │
          ┌──────────┴──────────┐
          ▼                     ▼
    ┌─────────────┐      ┌──────────────┐
    │  Modular    │      │   Global     │
    │  Components │      │   Context    │
    └─────────────┘      └──────────────┘
          │                     │
          └──────────┬──────────┘
                     │
     ┌───────────────┴────────────────┐
     │  IPC Communication (Tauri)     │
     └───────────┬────────────────────┘
                 │
┌────────────────▼─────────────────────┐
│       LOGIC LAYER (Backend)          │
│       Rust + Tauri + SQLite          │
├──────────────────────────────────────┤
│ • Business Services                  │
│ • Data Repositories                  │
│ • Validations & Business Rules       │
│ • Report Generation                  │
└────────────────┬─────────────────────┘
                 │
     ┌───────────▼─────────────┐
     │     SQLite Database     │
     └─────────────────────────┘
```

---

## 🛠️ Technologies Used

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

## ✨ Key Features

### Inventory Management
- **Product Control**: Create, update, delete, and categorize products
- **Stock Levels**: Real-time inventory monitoring
- **Categorization**: Hierarchical product organization by categories
- **Advanced Search**: Fast and precise filtering

### Sales System
- **Sales Processing**: User interface optimized for fast transactions
- **Real-Time Validations**: Instant availability verification
- **Transaction History**: Complete traceability of operations
- **User Profile**: Users can customize the sidebar and visible tools based on their workflow

### Reports & Analytics
- **Executive Dashboard**: Key performance indicator visualization
- **Sales Analysis**: Detailed and comparative reports
- **Data Export**: Report generation in multiple formats
- **Interactive Charts**: Visual and accessible information

### User Experience
- **Responsive Interface**: Adaptation to different screen sizes
- **Customizable Themes**: Light/dark mode based on preference
- **Multi-language Support**: Support for multiple languages (i18n)
- **Intuitive Navigation**: UX optimized for productivity

---

## 📊 Project Structure

```
src/
├── components/          # Reusable React components
│   ├── header.jsx      # Main header
│   ├── sidebar.jsx     # Side navigation
│   └── updateModal.jsx # Update modal
├── pages/              # Application main views
│   ├── dashboard.jsx   # Control panel
│   ├── products.jsx    # Product management
│   ├── sales.jsx       # Sales processing
│   ├── reports.jsx     # Analytics and reports
│   └── configuration.jsx # Settings
├── context/            # Context API for global state
│   ├── LanguageContext.jsx
│   └── ThemeContext.jsx
├── services/           # Services and business logic
├── styles/             # CSS styles by module
├── translations.js     # Multi-language configuration
└── App.jsx            # Main component

src-tauri/
├── src/
│   ├── commands/       # IPC commands exposed to frontend
│   │   ├── products.rs
│   │   ├── sales.rs
│   │   ├── categories.rs
│   │   └── export.rs
│   ├── services/       # Business logic
│   │   ├── producto_service.rs
│   │   ├── venta_service.rs
│   │   └── categoria_service.rs
│   ├── repos/          # Data access layer
│   │   ├── producto_repo.rs
│   │   ├── venta_repo.rs
│   │   └── categoria_repo.rs
│   ├── models.rs       # Data structures
│   ├── database.rs     # DB connection & management
│   └── main.rs         # Entry point

esquemaDB.sql          # Database schema
```

---

## 🎨 Interface & UX

### Main Modules

**Dashboard**
- Key Performance Indicators (KPIs)
- Sales trend charts
- Low inventory alerts
- Quick access to common functions

**Product Management**
- Interactive table with pagination
- Advanced search and filters
- Inline editing with validations
- Data import/export

**Point of Sale**
- Interface optimized for fast transactions
- Dynamic shopping cart
- Automatic calculations
- Receipt generation

**Reports**
- Multiple analysis views
- Filters by period, category, salesperson
- Comparative charts
- PDF/Excel export

---

## 🔐 Highlighted Technical Features

### Robust Backend
- Layered architecture: Commands → Services → Repositories
- Multi-level data validation
- Secure database operation handling
- Efficient data serialization with Serde

### Performance
- Native desktop application (Tauri)
- Compilation to machine code (Rust)
- Low-overhead IPC
- Optimized database queries

### Maintainability
- Modular and well-structured code
- Clear separation of concerns
- Established patterns (Service Pattern, Repository Pattern)
- Easy extensibility for new features

---

## 📸 Screenshots Gallery

> [Screenshots will be added soon, showcasing the dashboard interface, product management, and reports]

---

## 📝 Notes

This project was originally developed as a customized enterprise solution. The decision to share this architecture aims to demonstrate:

- Mastery of full-stack architectures
- Implementation of professional design patterns
- Ability to integrate complementary technologies
- Attention to detail in UX/UI
- Clean and scalable code writing

---

## 👨‍💻 About This Project

**Developer**: Samuel Sánchez Guzmán  
**Type**: Desktop Application  
**Status**: Production  
**Last Updated**: February 2026  

---

**© 2026 StockBeauty - Inventory Management System. All rights reserved.**
