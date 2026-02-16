use std::fs;
use std::path::{Path, PathBuf};
use tauri::State;
use rusqlite::params;

use crate::database;

/// ─── Exportar TODOS los datos a un solo archivo CSV ───
///
/// Genera un archivo con secciones separadas:
///   [CATEGORIAS], [PRODUCTOS], [VENTAS], [PRODUCTOS_VENDIDOS]
/// para que el usuario tenga un respaldo legible completo.
#[tauri::command]
pub fn export_all_csv(
    db_path: State<'_, PathBuf>,
    ruta_destino: String,
) -> Result<String, String> {
    let conn = database::open_connection(db_path.as_ref() as &Path)
        .map_err(|e| format!("No se pudo abrir la base de datos: {e}"))?;

    let mut csv = String::new();

    // ── Categorías ──
    csv.push_str("CATEGORIAS\n");
    csv.push_str("id_categoria,nombre\n");
    {
        let mut stmt = conn
            .prepare("SELECT id_categoria, nombre FROM categorias ORDER BY id_categoria")
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map([], |row| {
                Ok((row.get::<_, i64>(0)?, row.get::<_, String>(1)?))
            })
            .map_err(|e| e.to_string())?;

        for row in rows {
            let (id, nombre) = row.map_err(|e| e.to_string())?;
            csv.push_str(&format!("{},{}\n", id, escape_csv(&nombre)));
        }
    }

    csv.push('\n');

    // ── Productos ──
    csv.push_str("PRODUCTOS\n");
    csv.push_str("id_producto,nombre_producto,id_categoria,stock,precio,creado_at,actualizado_at\n");
    {
        let mut stmt = conn
            .prepare(
                "SELECT id_producto, nombre_producto, id_categoria, stock, precio, creado_at, actualizado_at \
                 FROM productos ORDER BY id_producto",
            )
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map([], |row| {
                Ok((
                    row.get::<_, i64>(0)?,
                    row.get::<_, String>(1)?,
                    row.get::<_, Option<i64>>(2)?,
                    row.get::<_, i64>(3)?,
                    row.get::<_, f64>(4)?,
                    row.get::<_, Option<String>>(5)?,
                    row.get::<_, Option<String>>(6)?,
                ))
            })
            .map_err(|e| e.to_string())?;

        for row in rows {
            let (id, nombre, cat, stock, precio, creado, actualizado) =
                row.map_err(|e| e.to_string())?;
            csv.push_str(&format!(
                "{},{},{},{},{:.2},{},{}\n",
                id,
                escape_csv(&nombre),
                cat.map_or(String::new(), |v| v.to_string()),
                stock,
                precio,
                creado.unwrap_or_default(),
                actualizado.unwrap_or_default(),
            ));
        }
    }

    csv.push('\n');

    // ── Ventas ──
    csv.push_str("VENTAS\n");
    csv.push_str("id_venta,fecha,nombre_clienta,total_venta,tipo_pago\n");
    {
        let mut stmt = conn
            .prepare(
                "SELECT id_venta, fecha, nombre_clienta, total_venta, tipo_pago \
                 FROM ventas ORDER BY id_venta",
            )
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map([], |row| {
                Ok((
                    row.get::<_, i64>(0)?,
                    row.get::<_, String>(1)?,
                    row.get::<_, String>(2)?,
                    row.get::<_, f64>(3)?,
                    row.get::<_, String>(4)?,
                ))
            })
            .map_err(|e| e.to_string())?;

        for row in rows {
            let (id, fecha, clienta, total, tipo) = row.map_err(|e| e.to_string())?;
            csv.push_str(&format!(
                "{},{},{},{:.2},{}\n",
                id,
                escape_csv(&fecha),
                escape_csv(&clienta),
                total,
                escape_csv(&tipo),
            ));
        }
    }

    csv.push('\n');

    // ── Productos vendidos ──
    csv.push_str("PRODUCTOS VENDIDOS\n");
    csv.push_str("id_producto_vendido,id_venta,id_producto,nombre_producto_snapshot,cantidad,precio_unitario,subtotal\n");
    {
        let mut stmt = conn
            .prepare(
                "SELECT id_producto_vendido, id_venta, id_producto, nombre_producto_snapshot, \
                        cantidad, precio_unitario, subtotal \
                 FROM productos_vendidos ORDER BY id_venta, id_producto_vendido",
            )
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map([], |row| {
                Ok((
                    row.get::<_, i64>(0)?,
                    row.get::<_, i64>(1)?,
                    row.get::<_, i64>(2)?,
                    row.get::<_, String>(3)?,
                    row.get::<_, i64>(4)?,
                    row.get::<_, f64>(5)?,
                    row.get::<_, f64>(6)?,
                ))
            })
            .map_err(|e| e.to_string())?;

        for row in rows {
            let (id, venta, prod, snap, cant, pu, sub) = row.map_err(|e| e.to_string())?;
            csv.push_str(&format!(
                "{},{},{},{},{},{:.2},{:.2}\n",
                id,
                venta,
                prod,
                escape_csv(&snap),
                cant,
                pu,
                sub,
            ));
        }
    }

    // Escribir archivo
    fs::write(&ruta_destino, csv.as_bytes())
        .map_err(|e| format!("No se pudo escribir el archivo: {e}"))?;

    Ok(ruta_destino)
}

/// ─── Respaldar la base de datos (copia .db) ───
#[tauri::command]
pub fn backup_database(
    db_path: State<'_, PathBuf>,
    ruta_destino: String,
) -> Result<String, String> {
    let source: &Path = db_path.as_ref();

    if !source.exists() {
        return Err("La base de datos no existe.".into());
    }

    // Forzar un checkpoint WAL para que todo esté en el .db principal
    {
        let conn = database::open_connection(source)
            .map_err(|e| format!("No se pudo abrir la DB para checkpoint: {e}"))?;
        conn.execute_batch("PRAGMA wal_checkpoint(TRUNCATE);")
            .map_err(|e| format!("Error en WAL checkpoint: {e}"))?;
    }

    fs::copy(source, &ruta_destino)
        .map_err(|e| format!("No se pudo copiar la base de datos: {e}"))?;

    Ok(ruta_destino)
}

/// ─── Importar / restaurar base de datos desde un archivo .db ───
/// Validaciones:
/// 1. El archivo debe existir
/// 2. Debe tener extensión .db
/// 3. Debe ser un SQLite válido (cabecera "SQLite format 3")
/// 4. Debe contener las 4 tablas esperadas
/// 5. Se crea un respaldo de la DB actual antes de sobreescribir
#[tauri::command]
pub fn import_database(
    db_path: State<'_, PathBuf>,
    ruta_origen: String,
) -> Result<String, String> {
    let import_path = std::path::Path::new(&ruta_origen);
    let current_db: &Path = db_path.as_ref();

    // Valida que el archivo exista
    if !import_path.exists() {
        return Err("FILE_NOT_FOUND".into());
    }

    // validacion para archivo .db
    match import_path.extension().and_then(|e| e.to_str()) {
        Some(ext) if ext.eq_ignore_ascii_case("db") => {}
        _ => return Err("INVALID_EXTENSION".into()),
    }

    // Valida que el archivo sea un SQLite válido
    {
        let header = fs::read(import_path)
            .map_err(|e| format!("No se pudo leer el archivo: {e}"))?;

        if header.len() < 16 || &header[..16] != b"SQLite format 3\0" {
            return Err("NOT_SQLITE".into());
        }
    }

    // Valida que el archivo contenga las tablas necesarias
    {
        let conn = rusqlite::Connection::open(import_path)
            .map_err(|_| "CORRUPT_DB".to_string())?;

        let required_tables = ["categorias", "productos", "ventas", "productos_vendidos"];
        for table in &required_tables {
            let exists: bool = conn
                .query_row(
                    "SELECT COUNT(*) > 0 FROM sqlite_master WHERE type='table' AND name=?1",
                    params![table],
                    |row| row.get(0),
                )
                .map_err(|_| "CORRUPT_DB".to_string())?;

            if !exists {
                return Err(format!("MISSING_TABLE:{}", table));
            }
        }
    }

    // crear respaldo de la DB actual antes de sobreescribir
    if current_db.exists() {
        // Checkpoint WAL de la DB actual
        {
            let conn = database::open_connection(current_db)
                .map_err(|e| format!("Error checkpoint DB actual: {e}"))?;
            conn.execute_batch("PRAGMA wal_checkpoint(TRUNCATE);")
                .ok(); // si falla el checkpoint, no es crítico
        }

        let backup_name = format!(
            "inventario_pre_import_{}.db",
            chrono::Local::now().format("%Y%m%d_%H%M%S")
        );
        let backup_path = current_db
            .parent()
            .unwrap_or(std::path::Path::new("."))
            .join(&backup_name);

        fs::copy(current_db, &backup_path)
            .map_err(|e| format!("No se pudo crear respaldo previo: {e}"))?;
    }

    // sobrescribe la DB actual con el archivo importado
    fs::copy(import_path, current_db)
        .map_err(|e| format!("No se pudo importar la base de datos: {e}"))?;

    // Limpiar archivos WAL/SHM residuales
    let wal_path = current_db.with_extension("db-wal");
    let shm_path = current_db.with_extension("db-shm");
    let _ = fs::remove_file(&wal_path);
    let _ = fs::remove_file(&shm_path);

    // verifica que la nueva DB se pueda abrir e inicializar correctamente
    database::init_db(current_db)
        .map_err(|e| format!("La DB importada no se pudo inicializar: {e}"))?;

    Ok("OK".into())
}

/// Escapa un valor para CSV (envuelve en comillas si contiene comas, saltos o comillas)
fn escape_csv(value: &str) -> String {
    if value.contains(',') || value.contains('"') || value.contains('\n') {
        format!("\"{}\"", value.replace('"', "\"\""))
    } else {
        value.to_string()
    }
}
