use std::path::PathBuf;
use tauri::State;
use crate::database;
use crate::models::{Venta, TipoPago, VentaCompletaInput, VentaCompletaOutput};
use crate::services::venta_service::VentaService;
use crate::services::producto_vendido_service::ProductoVendidoService;
use crate::services::producto_service::ProductoService;

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
    service.create_venta(&fecha, &nombre_clienta, total_venta, &tipo_pago).map_err(|e| e.to_string())
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
    db_path: State<'_, PathBuf>,
) -> Result<VentaCompletaOutput, String> {
    let db_path: &PathBuf = db_path.inner();
    let mut conn = database::init_db(db_path).map_err(|e| e.to_string())?;

    // 1. Validacion que exista al menos 1 producto a la venta
    if input.productos.is_empty() {
        return Err("Debe agregar al menos un producto a la venta".to_string());
    }

    // 2. Calcula el total de la venta
    let mut total_venta = 0.0;
    for item in &input.productos {
        total_venta += item.cantidad as f64 * item.precio_unitario;
    }

    // 3. Validar stock ANTES de iniciar la transacción
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

    // 4. INICIAR TRANSACCIÓN
    let tx = conn.transaction().map_err(|e| e.to_string())?;

    // 5. Insertar la venta en la tabla de ventas
    let venta_service = VentaService::new(&tx);
    let id_venta = venta_service
        .create_venta(&input.fecha, &input.nombre_clienta, total_venta, &input.tipo_pago)
        .map_err(|e| format!("Error al crear venta: {}", e))?;

    // 6. Inserta cada producto(item) vendido
    let producto_vendido_service = ProductoVendidoService::new(&tx);
    let mut items_insertados = 0;

    for item in &input.productos {
        let subtotal = item.cantidad as f64 * item.precio_unitario;

        producto_vendido_service
            .create_producto_vendido(id_venta, item.id_producto, &item.nombre_producto, item.cantidad, item.precio_unitario, subtotal)
            .map_err(|e| format!("Error al insertar producto con ID {}: {}", item.id_producto, e))?;

        items_insertados += 1;
    }

    // 7. COMMIT (confirmar todo)
    // Si ocurrió un error en 5 o 6, la transacción se revierte automáticamente, se confirma la transacción
    tx.commit().map_err(|e| format!("Error al confirmar la transacción: {}", e))?;

    // 8. Retorna el resultado
    Ok(VentaCompletaOutput {
        id_venta,
        total_venta,
        items_insertados,
    })
}

//Comando tauri para obtener el total de ventas a la fecha actual
#[tauri::command]
pub fn get_sales_today(db_path: State<'_, PathBuf>) -> Result<f64, String> {
    let db_path: &PathBuf = db_path.inner();
    let conn = database::init_db(db_path).map_err(|e| e.to_string())?;
    
    conn.query_row(
        "SELECT COALESCE(SUM(total_venta), 0.0) FROM ventas WHERE DATE(fecha) = DATE('now')",
        [],
        |row| row.get(0)
    ).map_err(|e| e.to_string())
}

//Comando tauri para obtener el total de ventas en los últimos 30 días
#[tauri::command]
pub fn get_sales_month(db_path: State<'_, PathBuf>) -> Result<f64, String> {
    let db_path: &PathBuf = db_path.inner();
    let conn = database::init_db(db_path).map_err(|e| e.to_string())?;
    
    conn.query_row(
        "SELECT COALESCE(SUM(total_venta), 0.0) FROM ventas WHERE DATE(fecha) BETWEEN DATE('now', '-30 days') AND DATE('now')",
        [],
        |row| row.get(0)
    ).map_err(|e| e.to_string())
}