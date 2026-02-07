use std::path::PathBuf;
use tauri::{State};
use std::fs;
use crate::database;
use crate::models::Producto;
use crate::services::producto_service::ProductoService;

#[tauri::command]
pub fn list_productos(db_path: State<'_, PathBuf>) -> Result<Vec<Producto>, String> 
{
    let db_path: &PathBuf = db_path.inner();
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
    image_bytes: Option<Vec<u8>>,
    image_ext: Option<String>,
    miniatura_base64: Option<String>,
    stock: i64,
    precio: f64,
    db_path: State<'_, PathBuf>,
) -> Result<i64, String> 
{
    let db_path: &PathBuf = db_path.inner();
    let conn = database::init_db(db_path).map_err(|e| e.to_string())?;
    let service = ProductoService::new(&conn);

    let mut ruta_imagen: Option<String> = None;
    
    if let (Some(bytes), Some(ext)) = (image_bytes, image_ext) {
        let image_dir = db_path
            .parent()
            .ok_or("No se pudo resolver la carpeta de imagenes")?
            .join("images");

        let filename = format!("producto_{}_{}.{}", chrono::Utc::now().timestamp_millis(),
            uuid::Uuid::new_v4(),
            ext);

        let full_path = image_dir.join(filename);
        fs::write(&full_path, bytes).map_err(|e| e.to_string())?;
        ruta_imagen = Some(full_path.to_string_lossy().to_string());
    }

    service
        .create_producto(&nombre_producto, id_categoria, ruta_imagen.as_deref(), miniatura_base64.as_deref(), stock, precio)
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