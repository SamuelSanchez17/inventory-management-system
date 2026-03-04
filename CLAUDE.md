# CLAUDE.md - StockBeauty Project Documentation

## Project Overview

**StockBeauty** is a professional inventory management and point-of-sale system built as a desktop application using Tauri (Rust backend) and React (frontend). The application provides comprehensive product management, sales processing, reporting, and data export capabilities.

**Architecture**: Full-stack desktop application with layered architecture
- **Frontend**: React 18 + Vite + CSS3
- **Backend**: Rust + Tauri + SQLite
- **Pattern**: Commands → Services → Repositories

---

## Project Structure

```
inventarioMK/
├── src/                          # Frontend (React)
│   ├── components/               # Reusable UI components
│   │   ├── header.jsx
│   │   ├── sidebar.jsx
│   │   └── updateModal.jsx
│   ├── pages/                    # Main application views
│   │   ├── dashboard.jsx
│   │   ├── products.jsx
│   │   ├── sales.jsx
│   │   ├── reports.jsx
│   │   └── configuration.jsx
│   ├── context/                  # React Context for global state
│   │   ├── LanguageContext.jsx
│   │   └── ThemeContext.jsx
│   ├── styles/                   # CSS modules
│   ├── translations.js           # i18n translations (ES/EN)
│   ├── App.jsx                   # Main app component
│   └── main.jsx                  # Entry point
│
├── src-tauri/                    # Backend (Rust)
│   ├── src/
│   │   ├── commands/             # Tauri IPC commands
│   │   │   ├── products.rs
│   │   │   ├── categories.rs
│   │   │   ├── sales.rs
│   │   │   ├── sold_products.rs
│   │   │   ├── export.rs
│   │   │   ├── profile.rs
│   │   │   └── mod.rs
│   │   ├── services/             # Business logic layer
│   │   │   ├── producto_service.rs
│   │   │   ├── categoria_service.rs
│   │   │   ├── venta_service.rs
│   │   │   ├── producto_vendido_service.rs
│   │   │   ├── perfil_service.rs
│   │   │   └── mod.rs
│   │   ├── repos/                # Data access layer
│   │   │   ├── producto_repo.rs
│   │   │   ├── categoria_repo.rs
│   │   │   ├── venta_repo.rs
│   │   │   ├── producto_vendido_repo.rs
│   │   │   ├── perfil_repo.rs
│   │   │   └── mod.rs
│   │   ├── models.rs             # Data structures
│   │   ├── database.rs           # DB connection & migrations
│   │   ├── lib.rs                # Library entry point
│   │   └── main.rs               # Application entry point
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   └── build.rs
│
├── esquemaDB.sql                 # Database schema
├── package.json
├── vite.config.js
├── eslint.config.js
└── README.md
```

---

## Build Commands

### Development

Start the application in development mode with hot-reload:

```bash
npm run tauri dev
```

This command:
- Starts the Vite dev server for the frontend
- Compiles the Rust backend
- Launches the Tauri application window
- Enables hot-reload for both frontend and backend changes

### Production Build

Build the application for production:

```bash
npm run tauri build
```

This creates:
- Optimized frontend bundle in `src-tauri/dist/`
- Compiled Rust binary
- Platform-specific installer in `src-tauri/target/release/bundle/`

### Frontend Only

Build only the frontend:

```bash
npm run build
```

Output: `src-tauri/dist/`

### Lint

Check code quality:

```bash
npm run lint
```

Uses ESLint with React hooks plugin.

---

## Testing

### Backend Tests (Rust)

Run all Rust tests:

```bash
cd src-tauri
cargo test
```

Run tests with output:

```bash
cargo test -- --nocapture
```

Run specific test:

```bash
cargo test test_name
```

### Frontend Tests

Currently, the project does not have a dedicated test suite for the frontend. To add testing:

1. Install testing dependencies:
```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom vitest
```

2. Create test files with `.test.jsx` extension
3. Run tests:
```bash
npm run test
```

---

## Code Conventions

### General Principles

1. **Separation of Concerns**: Follow the layered architecture strictly
   - Commands handle IPC communication only
   - Services contain business logic
   - Repositories handle database operations
   - Models define data structures

2. **Error Handling**: Always return `Result<T, String>` from commands
   ```rust
   pub fn command_name(...) -> Result<ReturnType, String> {
       // Convert errors to strings
       service.method().map_err(|e| e.to_string())
   }
   ```

3. **Naming Conventions**:
   - **Rust**: `snake_case` for functions and variables
   - **JavaScript**: `camelCase` for functions and variables
   - **Components**: `PascalCase` for React components
   - **Files**: `kebab-case` for CSS, `camelCase` for JS/JSX

### Rust Backend Conventions

#### File Organization

```rust
// src-tauri/src/commands/example.rs
use std::path::PathBuf;
use tauri::State;
use crate::database;
use crate::models::ModelName;
use crate::services::service_name::ServiceName;

#[tauri::command]
pub fn command_name(param: Type, db_path: State<'_, PathBuf>) -> Result<ReturnType, String> {
    let db_path = db_path.inner();
    let conn = database::open_connection(db_path).map_err(|e| e.to_string())?;
    let service = ServiceName::new(&conn);
    service.method(param).map_err(|e| e.to_string())
}
```

#### Service Pattern

```rust
// src-tauri/src/services/example_service.rs
use rusqlite::{Connection, Result};
use crate::models::ModelName;
use crate::repos::example_repo::ExampleRepo;

pub struct ExampleService<'a> {
    pub conn: &'a Connection,
}

impl<'a> ExampleService<'a> {
    pub fn new(conn: &'a Connection) -> Self {
        Self { conn }
    }

    pub fn method_name(&self, param: Type) -> Result<ReturnType> {
        let repo = ExampleRepo { conn: self.conn };
        repo.method(param)
    }
}
```

#### Repository Pattern

```rust
// src-tauri/src/repos/example_repo.rs
use rusqlite::{Connection, params, Result};
use crate::models::ModelName;

pub struct ExampleRepo<'a> {
    pub conn: &'a Connection,
}

impl<'a> ExampleRepo<'a> {
    pub fn method(&self, param: Type) -> Result<ReturnType> {
        let mut stmt = self.conn.prepare("SQL QUERY")?;
        // Implementation
    }
}
```

#### Model Definitions

```rust
// src-tauri/src/models.rs
use serde::{Serialize, Deserialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct ModelName {
    pub field_name: Type,
    // ...
}
```

### Frontend Conventions

#### Component Structure

```jsx
// src/pages/example.jsx
import { useContext, useState, useEffect } from 'react';
import { invoke, isTauri } from '@tauri-apps/api/core';
import toast from 'react-hot-toast';
import Sidebar from '../components/sidebar';
import { ThemeContext } from '../context/ThemeContext';
import { LanguageContext } from '../context/LanguageContext';
import '../styles/example.css';

export default function Example({ 
  onNavigate, 
  currentPage, 
  isSidebarCollapsed, 
  toggleSidebar, 
  profile 
}) {
  const { getActiveTheme } = useContext(ThemeContext);
  const { t } = useContext(LanguageContext);
  const isDark = getActiveTheme() === 'oscuro';
  
  const [state, setState] = useState(initialValue);

  useEffect(() => {
    // Side effects
  }, [dependencies]);

  const handleAction = async () => {
    if (!isTauri()) return;
    
    try {
      await invoke('command_name', { param: value });
      toast.success(t('success_message'));
    } catch (error) {
      console.error('Error:', error);
      toast.error(t('error_message'));
    }
  };

  return (
    <div className={`page-container ${isDark ? 'dark' : 'light'}`}>
      <Sidebar {...props} />
      <main className="page-content">
        {/* Content */}
      </main>
    </div>
  );
}
```

#### Translations

All user-facing strings must use the translation system:

```javascript
// src/translations.js
const translations = {
  es: {
    key_name: 'Texto en español',
    // ...
  },
  en: {
    key_name: 'Text in English',
    // ...
  },
};

export default translations;
```

Usage in components:

```jsx
const { t } = useContext(LanguageContext);
<p>{t('key_name')}</p>
```

#### CSS Conventions

1. Use BEM-like naming for CSS classes:
   ```css
   .component-name { }
   .component-name__element { }
   .component-name--modifier { }
   ```

2. Theme-aware styling:
   ```jsx
   className={`base-class ${isDark ? 'dark-class' : 'light-class'}`}
   ```

3. Keep component-specific styles in separate CSS files:
   ```
   src/styles/component-name.css
   ```

### Database Conventions

1. **Table Names**: Lowercase, plural
   - `productos`, `categorias`, `ventas`, `productos_vendidos`, `perfil`

2. **Column Names**: Lowercase with underscores
   - `id_producto`, `nombre_producto`, `creado_at`

3. **Primary Keys**: `id_<table_name_singular>`
   - `id_producto`, `id_categoria`, `id_venta`

4. **Foreign Keys**: `id_<referenced_table_singular>`
   - `id_categoria` in `productos` table

5. **Timestamps**: `creado_at`, `actualizado_at`

6. **Soft Deletes**: Use `activo` column (1 = active, 0 = inactive)

### Transaction Management

For operations involving multiple tables, use transactions:

```rust
let tx = conn.transaction().map_err(|e| e.to_string())?;

// Perform operations using &tx instead of &conn

tx.commit().map_err(|e| e.to_string())?;
```

Example: `create_venta_completa` in src-tauri/src/commands/sales.rs

### File Upload Handling

For image uploads:

1. Accept `Option<Vec<u8>>` for image bytes
2. Accept `Option<String>` for file extension
3. Accept `Option<String>` for base64 thumbnail
4. Store files in `app_data_dir/images/`
5. Use unique filenames: `tipo_timestamp_uuid.ext`
6. Store relative path in database

Example: `create_producto` in src-tauri/src/commands/products.rs

### Export/Import Conventions

1. **Excel Export**: Use `rust_xlsxwriter`
   - Merge cells for table titles
   - Apply formatting (colors, borders, alignment)
   - Add gap columns between tables
   - See: `export_all_xlsx` in src-tauri/src/commands/export.rs

2. **Database Backup**: Copy `.db` file with WAL checkpoint
   - See: `backup_database` in src-tauri/src/commands/export.rs

3. **Database Import**: Validate before overwriting
   - Check file exists
   - Validate `.db` extension
   - Verify SQLite header
   - Check required tables exist
   - Create backup before import
   - See: `import_database` in src-tauri/src/commands/export.rs

---

## Common Tasks

### Adding a New Feature

1. **Define the model** in `src-tauri/src/models.rs`
2. **Create repository** in `src-tauri/src/repos/feature_repo.rs`
3. **Create service** in `src-tauri/src/services/feature_service.rs`
4. **Add commands** in `src-tauri/src/commands/feature.rs`
5. **Register commands** in `src-tauri/src/lib.rs`
6. **Create frontend page** in `src/pages/feature.jsx`
7. **Add translations** in `src/translations.js`
8. **Add styles** in `src/styles/feature.css`

### Database Migrations

Add migration functions in `src-tauri/src/database.rs`:

```rust
fn migrate_feature_name(conn: &rusqlite::Connection) -> rusqlite::Result<()> {
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS table_name (
            id INTEGER PRIMARY KEY,
            field TEXT NOT NULL
        );"
    )?;
    Ok(())
}
```

Call it in `init_db()`.

### Adding Translations

1. Add keys to both `es` and `en` objects in `src/translations.js`
2. Use descriptive keys: `section_action_description`
   - Example: `config_theme_light_desc`, `sales_btn_pay`

---

## Important Files

### Configuration

- `package.json` - Frontend dependencies and scripts
- `vite.config.js` - Vite build configuration
- `eslint.config.js` - ESLint rules
- `src-tauri/Cargo.toml` - Rust dependencies
- `src-tauri/tauri.conf.json` - Tauri configuration

### Core Backend Files

- `src-tauri/src/lib.rs` - Application setup, command registration
- `src-tauri/src/database.rs` - Database initialization and migrations
- `src-tauri/src/models.rs` - All data structures

### Core Frontend Files

- `src/App.jsx` - Main application shell, routing, update logic
- `src/translations.js` - i18n translations
- `src/context/ThemeContext.jsx` - Theme management
- `src/context/LanguageContext.jsx` - Language management

---

## Dependencies

### Frontend

- **react** (^18.3.1) - UI framework
- **react-hot-toast** (^2.4.1) - Toast notifications
- **phosphor-react** (^1.4.1) - Icon library
- **recharts** (^2.15.0) - Charts for dashboard
- **@tauri-apps/api** - Tauri IPC
- **@tauri-apps/plugin-dialog** - File dialogs
- **@tauri-apps/plugin-updater** - Auto-updates

### Backend

- **tauri** (2.10.2) - Desktop app framework
- **rusqlite** (0.33.0) - SQLite database
- **serde** (1.0) - Serialization/deserialization
- **chrono** (0.4) - Date/time handling
- **uuid** (1.11) - UUID generation
- **rust_xlsxwriter** (0.81.0) - Excel export

---

## Environment Setup

### Prerequisites

- **Node.js** >= 18
- **Rust** >= 1.70
- **npm** or **pnpm**

### Installation

1. Clone the repository
2. Install frontend dependencies:
   ```bash
   npm install
   ```
3. Install Rust dependencies (automatic on first build)
4. Run development server:
   ```bash
   npm run tauri dev
   ```

---

## Database Location

Development:
- Windows: `C:\Users\<user>\AppData\Roaming\com.tauri.dev\inventario.db`
- macOS: `~/Library/Application Support/com.tauri.dev/inventario.db`
- Linux: `~/.local/share/com.tauri.dev/inventario.db`

Images are stored in the `images/` subdirectory next to the database.

---

## Known Patterns

### Tauri Commands Always Follow This Pattern:

```rust
#[tauri::command]
pub fn command_name(
    param: Type,
    db_path: State<'_, PathBuf>
) -> Result<ReturnType, String> {
    let db_path = db_path.inner();
    let conn = database::init_db(db_path).map_err(|e| e.to_string())?;
    let service = ServiceName::new(&conn);
    service.method(param).map_err(|e| e.to_string())
}
```

### Frontend Invoke Pattern:

```jsx
const handleAction = async () => {
    if (!isTauri()) return;
    
    try {
        const result = await invoke('command_name', { 
            param: value 
        });
        // Handle success
        toast.success(t('success_key'));
    } catch (error) {
        console.error('Error:', error);
        toast.error(t('error_key'));
    }
};
```

---

## Troubleshooting

### Build Issues

1. **Rust compilation errors**: Ensure Rust toolchain is up to date
   ```bash
   rustup update
   ```

2. **Frontend build errors**: Clear node_modules and reinstall
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Tauri CLI errors**: Update Tauri CLI
   ```bash
   npm install -g @tauri-apps/cli
   ```

### Database Issues

1. **Database locked**: Close all instances of the app
2. **Corrupted database**: Restore from backup or delete and restart
3. **Missing tables**: Delete database file to trigger recreation

---

## Additional Resources

- [Tauri Documentation](https://tauri.app/)
- [React Documentation](https://react.dev/)
- [Rusqlite Documentation](https://docs.rs/rusqlite/)
- [Vite Documentation](https://vitejs.dev/)

---

**Last Updated**: March 2026  
**Maintainer**: Samuel Sánchez Guzmán
