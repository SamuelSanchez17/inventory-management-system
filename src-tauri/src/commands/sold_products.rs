use std::path::PathBuf;
use tauri::State;
use crate::database;
use crate::models::ProductoVendido;
use crate::services::producto_vendido_service::ProductoVendidoService;

#[tauri::command]
pub fn list_productos_vendidos(db_path: State<'_, PathBuf>) -> Result<Vec<ProductoVendido>, String> 
{
    let db_path: &PathBuf = db_path.inner();
    let conn = database::init_db(db_path).map_err(|e| e.to_string())?;
    let service = ProductoVendidoService::new(&conn);
    service.list_productos_vendidos().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_producto_vendido(id: i64, db_path: State<'_, PathBuf>) -> Result<ProductoVendido, String> 
{
    let db_path: &PathBuf = db_path.inner();
    let conn = database::init_db(db_path).map_err(|e| e.to_string())?;
    let service = ProductoVendidoService::new(&conn);
    service.get_producto_vendido(id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_productos_by_venta(id_venta: i64, db_path: State<'_, PathBuf>) -> Result<Vec<ProductoVendido>, String> 
{
    let db_path: &PathBuf = db_path.inner();
    let conn = database::init_db(db_path).map_err(|e| e.to_string())?;
    let service = ProductoVendidoService::new(&conn);
    service.get_productos_by_venta(id_venta).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_producto_vendido(
    id_venta: i64,
    id_producto: i64,
    cantidad: i64,
    precio_unitario: f64,
    subtotal: f64,
    db_path: State<'_, PathBuf>,
) -> Result<i64, String> {
    let db_path: &PathBuf = db_path.inner();
    let conn = database::init_db(db_path).map_err(|e| e.to_string())?;
    let service = ProductoVendidoService::new(&conn);
    service
        .create_producto_vendido(id_venta, id_producto, cantidad, precio_unitario, subtotal)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_producto_vendido(producto_vendido: ProductoVendido, db_path: State<'_, PathBuf>) -> Result<(), String> 
{
    let db_path: &PathBuf = db_path.inner();
    let conn = database::init_db(db_path).map_err(|e| e.to_string())?;
    let service = ProductoVendidoService::new(&conn);
    service.update_producto_vendido(&producto_vendido).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_producto_vendido(id: i64, db_path: State<'_, PathBuf>) -> Result<(), String> 
{
    let db_path: &PathBuf = db_path.inner();
    let conn = database::init_db(db_path).map_err(|e| e.to_string())?;
    let service = ProductoVendidoService::new(&conn);
    service.delete_producto_vendido(id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_productos_by_venta(id_venta: i64, db_path: State<'_, PathBuf>) -> Result<(), String> 
{
    let db_path: &PathBuf = db_path.inner();
    let conn = database::init_db(db_path).map_err(|e| e.to_string())?;
    let service = ProductoVendidoService::new(&conn);
    service.delete_productos_by_venta(id_venta).map_err(|e| e.to_string())
}
