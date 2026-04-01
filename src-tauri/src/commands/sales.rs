use std::path::PathBuf;
use tauri::State;
use crate::database;
use crate::models::{
    AbonoVenta,
    RegistrarAbonoInput,
    TipoPago,
    TopProducto,
    Venta,
    VentaCobranzaView,
    VentaCompletaInput,
    VentaCompletaOutput,
};
use crate::repos::venta_repo::VentaRepo;
use crate::services::abono_venta_service::AbonoVentaService;
use crate::services::venta_service::VentaService;
use crate::services::producto_vendido_service::ProductoVendidoService;
use crate::services::producto_service::ProductoService;

pub fn get_sales_total_between_dates(
    conn: &rusqlite::Connection,
    start_date: &str,
    end_date: &str,
) -> rusqlite::Result<f64> {
    conn.query_row(
        "SELECT 
            COALESCE(
                (
                    SELECT SUM(v.total_venta)
                    FROM ventas v
                    WHERE v.tipo_pago = 'De Contado'
                      AND DATE(v.fecha) BETWEEN DATE(?1) AND DATE(?2)
                ),
                0.0
            )
            +
            COALESCE(
                (
                    SELECT SUM(a.monto_abono)
                    FROM abonos_venta a
                    INNER JOIN ventas v ON v.id_venta = a.id_venta
                    WHERE v.tipo_pago = 'Abono'
                      AND DATE(a.fecha_abono) BETWEEN DATE(?1) AND DATE(?2)
                ),
                0.0
            )",
        [start_date, end_date],
        |row| row.get(0),
    )
}

#[tauri::command]
pub fn list_ventas(db_path: State<'_, PathBuf>) -> Result<Vec<Venta>, String> 
{
    let db_path: &PathBuf = db_path.inner();
    let conn = database::init_db(db_path).map_err(|e| e.to_string())?;
    let service = VentaService::new(&conn);
    service.list_ventas().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_venta(id: i64, db_path: State<'_, PathBuf>) -> Result<Venta, String> 
{
    let db_path: &PathBuf = db_path.inner();
    let conn = database::init_db(db_path).map_err(|e| e.to_string())?;
    let service = VentaService::new(&conn);
    service.get_venta(id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_venta(fecha: String, nombre_clienta: String, total_venta: f64, tipo_pago: TipoPago, db_path: State<'_, PathBuf>) -> Result<i64, String> 
{
    let db_path: &PathBuf = db_path.inner();
    let conn = database::init_db(db_path).map_err(|e| e.to_string())?;
    let service = VentaService::new(&conn);
    service.create_venta(&fecha, &nombre_clienta, "", total_venta, &tipo_pago).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_venta(venta: Venta, db_path: State<'_, PathBuf>) -> Result<(), String> 
{
    let db_path: &PathBuf = db_path.inner();
    let conn = database::init_db(db_path).map_err(|e| e.to_string())?;
    let service = VentaService::new(&conn);
    service.update_venta(&venta).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_venta(id: i64, db_path: State<'_, PathBuf>) -> Result<(), String> 
{
    let db_path: &PathBuf = db_path.inner();
    let conn = database::init_db(db_path).map_err(|e| e.to_string())?;
    let service = VentaService::new(&conn);
    service.delete_venta(id).map_err(|e| e.to_string())
}

// ============== Venta COMPLETA ==============
// Crea una venta completa con todos sus productos en una sola transacción atómica
#[tauri::command]
pub fn create_venta_completa(
    input: VentaCompletaInput,
    abono_inicial: Option<f64>,
    db_path: State<'_, PathBuf>,
) -> Result<VentaCompletaOutput, String> {
    let db_path: &PathBuf = db_path.inner();
    let mut conn = database::init_db(db_path).map_err(|e| e.to_string())?;

    // Validacion que exista al menos 1 producto a la venta
    if input.productos.is_empty() {
        return Err("Debe agregar al menos un producto a la venta".to_string());
    }

    let nombre = input.nombre_clienta.trim();
    if nombre.is_empty() {
        return Err("Debe ingresar el nombre de la clienta".to_string());
    }

    let apellido = input.apellido_clienta.trim();
    if apellido.is_empty() {
        return Err("Debe ingresar el apellido de la clienta".to_string());
    }

    // Calcula el total de la venta
    let mut total_venta = 0.0;
    for item in &input.productos {
        total_venta += item.cantidad as f64 * item.precio_unitario;
    }

    // Validar stock ANTES de iniciar la transacción
    let producto_service = ProductoService::new(&conn);
    for item in &input.productos {
        let producto = producto_service
            .get_producto(item.id_producto)
            .map_err(|e| format!("Producto con ID {} no encontrado: {}", item.id_producto, e))?;

        if producto.stock < item.cantidad {
            return Err(format!(
                "Stock insuficiente para '{}'. Disponible: {}, Solicitado: {}",
                producto.nombre_producto, producto.stock, item.cantidad
            ));
        }
    }

    // INICIAR TRANSACCIÓN
    let tx = conn.transaction().map_err(|e| e.to_string())?;

    // Inserta la venta en la tabla de ventas
    let venta_service = VentaService::new(&tx);
    let id_venta = venta_service
        .create_venta_with_initial_abono(
            &input.fecha,
            nombre,
            apellido,
            total_venta,
            &input.tipo_pago,
            abono_inicial,
        )
        .map_err(|e| format!("Error al crear venta: {}", e))?;

    // Inserta cada producto(item) vendido
    let producto_vendido_service = ProductoVendidoService::new(&tx);
    let mut items_insertados = 0;

    for item in &input.productos {
        let subtotal = item.cantidad as f64 * item.precio_unitario;

        producto_vendido_service
            .create_producto_vendido(id_venta, item.id_producto, &item.nombre_producto, item.cantidad, item.precio_unitario, subtotal)
            .map_err(|e| format!("Error al insertar producto con ID {}: {}", item.id_producto, e))?;

        items_insertados += 1;
    }

    // COMMIT (confirmacion de todo)
    // Si ocurrió un error en 5 o 6, la transacción se revierte automáticamente, se confirma la transacción
    tx.commit().map_err(|e| format!("Error al confirmar la transacción: {}", e))?;

    // Retorna el resultado
    Ok(VentaCompletaOutput {
        id_venta,
        total_venta,
        items_insertados,
    })
}

// Top 5 productos más vendidos (unidades + ingreso)
#[tauri::command]
pub fn get_top_productos(db_path: State<'_, PathBuf>) -> Result<Vec<TopProducto>, String> {
    let db_path: &PathBuf = db_path.inner();
    let conn = database::init_db(db_path).map_err(|e| e.to_string())?;

    let mut stmt = conn.prepare(
        "SELECT nombre_producto_snapshot, \
                SUM(cantidad) AS total_unidades, \
                SUM(subtotal) AS total_ingreso \
         FROM productos_vendidos \
         GROUP BY nombre_producto_snapshot \
         ORDER BY total_ingreso DESC \
         LIMIT 5"
    ).map_err(|e| e.to_string())?;

    let rows = stmt.query_map([], |row| {
        Ok(TopProducto {
            nombre: row.get(0)?,
            unidades: row.get(1)?,
            ingreso: row.get(2)?,
        })
    }).map_err(|e| e.to_string())?;

    let mut result = Vec::new();
    for row in rows {
        result.push(row.map_err(|e| e.to_string())?);
    }
    Ok(result)
}

//Comando tauri para obtener el total de ventas en los últimos 7 días
#[tauri::command]
pub fn get_sales_today(db_path: State<'_, PathBuf>) -> Result<f64, String> {
    let db_path: &PathBuf = db_path.inner();
    let conn = database::init_db(db_path).map_err(|e| e.to_string())?;

    let today: String = conn
        .query_row("SELECT DATE('now')", [], |row| row.get(0))
        .map_err(|e| e.to_string())?;
    let start_date: String = conn
        .query_row("SELECT DATE('now', '-6 days')", [], |row| row.get(0))
        .map_err(|e| e.to_string())?;

    get_sales_total_between_dates(&conn, &start_date, &today).map_err(|e| e.to_string())
}

//Comando tauri para obtener el total de ventas en los últimos 30 días
#[tauri::command]
pub fn get_sales_month(db_path: State<'_, PathBuf>) -> Result<f64, String> {
    let db_path: &PathBuf = db_path.inner();
    let conn = database::init_db(db_path).map_err(|e| e.to_string())?;

    let today: String = conn
        .query_row("SELECT DATE('now')", [], |row| row.get(0))
        .map_err(|e| e.to_string())?;
    let start_date: String = conn
        .query_row("SELECT DATE('now', '-30 days')", [], |row| row.get(0))
        .map_err(|e| e.to_string())?;

    get_sales_total_between_dates(&conn, &start_date, &today).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn registrar_abono_venta(
    input: RegistrarAbonoInput,
    db_path: State<'_, PathBuf>,
) -> Result<i64, String> {
    let db_path: &PathBuf = db_path.inner();
    let conn = database::init_db(db_path).map_err(|e| e.to_string())?;
    let service = AbonoVentaService::new(&conn);
    service.registrar_abono(&input).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_abonos_por_venta(
    id_venta: i64,
    db_path: State<'_, PathBuf>,
) -> Result<Vec<AbonoVenta>, String> {
    let db_path: &PathBuf = db_path.inner();
    let conn = database::init_db(db_path).map_err(|e| e.to_string())?;
    let service = AbonoVentaService::new(&conn);
    service
        .listar_abonos_por_venta(id_venta)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_cobranza_summary(
    id_venta: i64,
    db_path: State<'_, PathBuf>,
) -> Result<VentaCobranzaView, String> {
    let db_path: &PathBuf = db_path.inner();
    let conn = database::init_db(db_path).map_err(|e| e.to_string())?;
    let service = VentaService::new(&conn);
    service
        .get_cobranza_summary(id_venta)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_ventas_con_cobranza(
    db_path: State<'_, PathBuf>,
) -> Result<Vec<VentaCobranzaView>, String> {
    let db_path: &PathBuf = db_path.inner();
    let conn = database::init_db(db_path).map_err(|e| e.to_string())?;
    let repo = VentaRepo { conn: &conn };
    repo.list_with_cobranza().map_err(|e| e.to_string())
}