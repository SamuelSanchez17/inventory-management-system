use std::path::PathBuf;
use tauri::State;
use crate::database;
use crate::models::{Venta, TipoPago};
use crate::services::venta_service::VentaService;

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