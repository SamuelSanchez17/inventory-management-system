use std::path::PathBuf;
use tauri::State;
use crate::database;
use crate::models::Producto;
use crate::services::producto_service::ProductoService; // ajusta el path según el rename a snake_case

#[tauri::command]
pub fn list_productos(db_path: State<'_, PathBuf>) -> Result<Vec<Producto>, String> 
{
    let db_path: &PathBuf = db_path.inner(); // anota el tipo aquí
    let conn = database::init_db(db_path).map_err(|e| e.to_string())?;
    let service = ProductoService::new(&conn);
    service.list_productos().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_producto(id: i64, db_path: State<'_, PathBuf>) -> Result<Producto, String> 
{
    let db_path: &PathBuf = db_path.inner();
    let conn = database::init_db(db_path).map_err(|e| e.to_string())?;
    let service = ProductoService::new(&conn);
    service.get_producto(id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_producto(
    nombre_producto: String,
    id_categoria: Option<i64>,
    ruta_imagen: Option<String>,
    stock: i64,
    precio: f64,
    db_path: State<'_, PathBuf>,
) -> Result<i64, String> {
    let db_path: &PathBuf = db_path.inner();
    let conn = database::init_db(db_path).map_err(|e| e.to_string())?;
    let service = ProductoService::new(&conn);
    service
        .create_producto(&nombre_producto, id_categoria, ruta_imagen.as_deref(), stock, precio)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_producto(producto: Producto, db_path: State<'_, PathBuf>) -> Result<(), String> 
{
    let db_path: &PathBuf = db_path.inner();
    let conn = database::init_db(db_path).map_err(|e| e.to_string())?;
    let service = ProductoService::new(&conn);
    service.update_producto(&producto).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_producto(id: i64, db_path: State<'_, PathBuf>) -> Result<(), String> 
{
    let db_path: &PathBuf = db_path.inner();
    let conn = database::init_db(db_path).map_err(|e| e.to_string())?;
    let service = ProductoService::new(&conn);
    service.delete_producto(id).map_err(|e| e.to_string())
}