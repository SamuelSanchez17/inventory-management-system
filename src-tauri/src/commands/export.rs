use std::fs;
use std::path::{Path, PathBuf};
use tauri::State;
use rusqlite::params;
use rust_xlsxwriter::*;

use crate::database;

/// ─── Exportar TODOS los datos a un archivo XLSX ───
///
/// Genera un archivo Excel con las 4 tablas lado a lado, títulos combinados
/// y centrados, separadas por una columna vacía entre cada tabla.
///
/// Layout de columnas:
///   CATEGORIAS (2 cols) | gap | PRODUCTOS (7 cols) | gap | VENTAS (5 cols) | gap | PRODUCTOS_VENDIDOS (7 cols)
#[tauri::command]
pub fn export_all_xlsx(
    db_path: State<'_, PathBuf>,
    ruta_destino: String,
) -> Result<String, String> {
    let conn = database::open_connection(db_path.as_ref() as &Path)
        .map_err(|e| format!("No se pudo abrir la base de datos: {e}"))?;

    // Número de columnas por tabla
    const CAT_COLS: u16 = 2;
    const PROD_COLS: u16 = 8;
    const VENT_COLS: u16 = 5;
    const PV_COLS: u16 = 6;

    // Columnas de inicio de cada tabla (con 1 columna gap entre cada una)
    const CAT_START: u16 = 0;                                          // A
    const PROD_START: u16 = CAT_START + CAT_COLS + 1;                  // D  (0+2+1=3)
    const VENT_START: u16 = PROD_START + PROD_COLS + 1;                // M  (3+8+1=12)
    const PV_START: u16 = VENT_START + VENT_COLS + 1;                  // S  (12+5+1=18)

    // ── Recopilar datos ──

    // Categorías
    let cat_headers = ["id_categoria", "nombre"];
    let mut cat_rows: Vec<Vec<String>> = Vec::new();
    {
        let mut stmt = conn
            .prepare("SELECT id_categoria, nombre FROM categorias ORDER BY id_categoria")
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map([], |row| {
                Ok(vec![
                    row.get::<_, i64>(0)?.to_string(),
                    row.get::<_, String>(1)?,
                ])
            })
            .map_err(|e| e.to_string())?;
        for row in rows {
            cat_rows.push(row.map_err(|e| e.to_string())?);
        }
    }

    // Productos (JOIN con categorias para mostrar nombre en vez de id)
    let prod_headers = [
        "id_producto", "nombre_producto", "categoria",
        "stock", "precio", "creado_at", "actualizado_at", "estado",
    ];
    let mut prod_rows: Vec<Vec<String>> = Vec::new();
    {
        let mut stmt = conn
            .prepare(
                "SELECT p.id_producto, p.nombre_producto, COALESCE(c.nombre, '') as categoria, \
                        p.stock, p.precio, p.creado_at, p.actualizado_at, p.activo \
                 FROM productos p \
                 LEFT JOIN categorias c ON p.id_categoria = c.id_categoria \
                 ORDER BY p.id_producto",
            )
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map([], |row| {
                let precio: f64 = row.get(4)?;
                let activo: i64 = row.get(7)?;
                Ok(vec![
                    row.get::<_, i64>(0)?.to_string(),
                    row.get::<_, String>(1)?,
                    row.get::<_, String>(2)?,
                    row.get::<_, i64>(3)?.to_string(),
                    if precio.fract() == 0.0 { format!("{}", precio as i64) } else { format!("{}", precio) },
                    row.get::<_, Option<String>>(5)?.unwrap_or_default(),
                    row.get::<_, Option<String>>(6)?.unwrap_or_default(),
                    if activo == 1 { "Activo".to_string() } else { "Descontinuado".to_string() },
                ])
            })
            .map_err(|e| e.to_string())?;
        for row in rows {
            prod_rows.push(row.map_err(|e| e.to_string())?);
        }
    }

    // Ventas
    let vent_headers = [
        "id_venta", "fecha", "nombre_clienta", "total_venta", "tipo_pago",
    ];
    let mut vent_rows: Vec<Vec<String>> = Vec::new();
    {
        let mut stmt = conn
            .prepare(
                "SELECT id_venta, fecha, nombre_clienta, total_venta, tipo_pago \
                 FROM ventas ORDER BY id_venta",
            )
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map([], |row| {
                let total: f64 = row.get(3)?;
                let fecha_raw: String = row.get(1)?;
                Ok(vec![
                    row.get::<_, i64>(0)?.to_string(),
                    normalize_fecha(&fecha_raw),
                    row.get::<_, String>(2)?,
                    if total.fract() == 0.0 { format!("{}", total as i64) } else { format!("{}", total) },
                    row.get::<_, String>(4)?,
                ])
            })
            .map_err(|e| e.to_string())?;
        for row in rows {
            vent_rows.push(row.map_err(|e| e.to_string())?);
        }
    }

    // Productos vendidos (nombres legibles en vez de IDs)
    let pv_headers = [
        "nro", "nro_venta", "producto",
        "cantidad", "precio_unitario", "subtotal",
    ];
    let mut pv_rows: Vec<Vec<String>> = Vec::new();
    {
        let mut stmt = conn
            .prepare(
                "SELECT pv.id_producto_vendido, pv.id_venta, pv.nombre_producto_snapshot, \
                        pv.cantidad, pv.precio_unitario, pv.subtotal \
                 FROM productos_vendidos pv \
                 ORDER BY pv.id_venta, pv.id_producto_vendido",
            )
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map([], |row| {
                let pu: f64 = row.get(4)?;
                let sub: f64 = row.get(5)?;
                Ok(vec![
                    row.get::<_, i64>(0)?.to_string(),
                    row.get::<_, i64>(1)?.to_string(),
                    row.get::<_, String>(2)?,
                    row.get::<_, i64>(3)?.to_string(),
                    if pu.fract() == 0.0 { format!("{}", pu as i64) } else { format!("{:.2}", pu) },
                    if sub.fract() == 0.0 { format!("{}", sub as i64) } else { format!("{:.2}", sub) },
                ])
            })
            .map_err(|e| e.to_string())?;
        for row in rows {
            pv_rows.push(row.map_err(|e| e.to_string())?);
        }
    }

    // ── Construir archivo XLSX ──
    let mut workbook = Workbook::new();
    let sheet = workbook.add_worksheet();
    sheet.set_name("Inventario").map_err(|e| e.to_string())?;

    // ── Formatos ──
    // Título: negrita, centrado, fondo de color
    let title_format = Format::new()
        .set_bold()
        .set_align(FormatAlign::Center)
        .set_align(FormatAlign::VerticalCenter)
        .set_font_size(11.0)
        .set_background_color(Color::RGB(0xD9E1F2))
        .set_border(FormatBorder::Thin);

    // Encabezados: negrita, centrado
    let header_format = Format::new()
        .set_bold()
        .set_align(FormatAlign::Center)
        .set_background_color(Color::RGB(0xE2EFDA))
        .set_border(FormatBorder::Thin);

    // Datos: borde fino
    let data_format = Format::new()
        .set_border(FormatBorder::Thin);

    // ── Fila 0: Títulos combinados y centrados ──
    // Categorías: merge de col CAT_START a CAT_START+CAT_COLS-1
    sheet.merge_range(
        0, CAT_START, 0, CAT_START + CAT_COLS - 1,
        "CATEGORIAS", &title_format,
    ).map_err(|e| e.to_string())?;

    // Productos
    sheet.merge_range(
        0, PROD_START, 0, PROD_START + PROD_COLS - 1,
        "PRODUCTOS", &title_format,
    ).map_err(|e| e.to_string())?;

    // Ventas
    sheet.merge_range(
        0, VENT_START, 0, VENT_START + VENT_COLS - 1,
        "VENTAS", &title_format,
    ).map_err(|e| e.to_string())?;

    // Productos vendidos
    sheet.merge_range(
        0, PV_START, 0, PV_START + PV_COLS - 1,
        "PRODUCTOS VENDIDOS", &title_format,
    ).map_err(|e| e.to_string())?;

    // ── Fila 1: Encabezados de columna ──
    let table_configs: &[(&[&str], u16)] = &[
        (&cat_headers, CAT_START),
        (&prod_headers, PROD_START),
        (&vent_headers, VENT_START),
        (&pv_headers, PV_START),
    ];

    for (headers, start_col) in table_configs {
        for (j, header) in headers.iter().enumerate() {
            sheet.write_string_with_format(
                1, *start_col + j as u16, *header, &header_format,
            ).map_err(|e| e.to_string())?;
        }
    }

    // ── Filas de datos (a partir de fila 2) ──
    let data_tables: &[(&Vec<Vec<String>>, u16, u16)] = &[
        (&cat_rows, CAT_START, CAT_COLS),
        (&prod_rows, PROD_START, PROD_COLS),
        (&vent_rows, VENT_START, VENT_COLS),
        (&pv_rows, PV_START, PV_COLS),
    ];

    for (rows, start_col, num_cols) in data_tables {
        for (i, row) in rows.iter().enumerate() {
            for j in 0..(*num_cols as usize) {
                let value = row.get(j).map(|s| s.as_str()).unwrap_or("");
                // Intentar escribir como número si es posible
                if let Ok(n) = value.parse::<f64>() {
                    sheet.write_number_with_format(
                        (i + 2) as u32, *start_col + j as u16, n, &data_format,
                    ).map_err(|e| e.to_string())?;
                } else {
                    sheet.write_string_with_format(
                        (i + 2) as u32, *start_col + j as u16, value, &data_format,
                    ).map_err(|e| e.to_string())?;
                }
            }
        }
    }

    // ── Autoajustar anchos de columna ──
    // Calcular ancho óptimo para cada columna basado en el contenido
    let all_tables: &[(&[&str], &Vec<Vec<String>>, u16, u16)] = &[
        (&cat_headers, &cat_rows, CAT_START, CAT_COLS),
        (&prod_headers, &prod_rows, PROD_START, PROD_COLS),
        (&vent_headers, &vent_rows, VENT_START, VENT_COLS),
        (&pv_headers, &pv_rows, PV_START, PV_COLS),
    ];

    for (headers, rows, start_col, num_cols) in all_tables {
        for j in 0..(*num_cols as usize) {
            let header_len = headers.get(j).map(|h| h.len()).unwrap_or(0);
            let max_data_len = rows.iter()
                .filter_map(|row| row.get(j))
                .map(|v| v.len())
                .max()
                .unwrap_or(0);
            let width = std::cmp::max(header_len, max_data_len) as f64 + 2.0;
            let width = width.min(35.0).max(8.0);
            sheet.set_column_width(*start_col + j as u16, width)
                .map_err(|e| e.to_string())?;
        }
    }

    // Columnas de separación (gap) con ancho pequeño
    let gap_cols = [CAT_START + CAT_COLS, PROD_START + PROD_COLS, VENT_START + VENT_COLS];
    for gap_col in gap_cols {
        sheet.set_column_width(gap_col, 2.0).map_err(|e| e.to_string())?;
    }

    // ── Guardar archivo ──
    workbook.save(&ruta_destino).map_err(|e| format!("No se pudo escribir el archivo: {e}"))?;

    Ok(ruta_destino)
}

fn normalize_fecha(value: &str) -> String {
    // Expected output: "YYYY-MM-DD HH:MM:SS"
    if let Some((date_part, time_part)) = value.split_once('T') {
        let mut time = time_part.trim_end_matches('Z');
        if let Some((t, _ms)) = time.split_once('.') {
            time = t;
        }
        return format!("{} {}", date_part, time);
    }

    if let Some((date_part, time_part)) = value.split_once(' ') {
        let mut time = time_part;
        if let Some((t, _ms)) = time.split_once('.') {
            time = t;
        }
        return format!("{} {}", date_part, time);
    }

    value.to_string()
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
