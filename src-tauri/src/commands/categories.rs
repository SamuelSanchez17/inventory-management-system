use std::path::PathBuf;
use tauri::State;
use crate::database;
use crate::models::Categoria;
use crate::services::categoria_service::CategoriaService;

#[tauri::command]
pub fn list_categorias(db_path: State<'_, PathBuf>) -> Result<Vec<Categoria>, String> 
{
    let db_path = db_path.inner();
    let conn = database::open_connection(db_path).map_err(|e| e.to_string())?;
    let service = CategoriaService::new(&conn);
    service.list_categorias().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_categoria(id: i64, db_path: State<'_, PathBuf>) -> Result<Categoria, String> 
{
    let db_path = db_path.inner();
    let conn = database::open_connection(db_path).map_err(|e| e.to_string())?;
    let service = CategoriaService::new(&conn);
    service.get_categoria(id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_categoria(nombre: String, db_path: State<'_, PathBuf>) -> Result<i64, String> 
{
    let db_path = db_path.inner();
    let conn = database::open_connection(db_path).map_err(|e| e.to_string())?;
    let service = CategoriaService::new(&conn);
    service.create_categoria(&nombre).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_categoria(categoria: Categoria, db_path: State<'_, PathBuf>) -> Result<(), String> 
{
    let db_path = db_path.inner();
    let conn = database::open_connection(db_path).map_err(|e| e.to_string())?;
    let service = CategoriaService::new(&conn);
    service.update_categoria(&categoria).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_categoria(id: i64, db_path: State<'_, PathBuf>) -> Result<(), String> 
{
    let db_path = db_path.inner();
    let conn = database::open_connection(db_path).map_err(|e| e.to_string())?;
    let service = CategoriaService::new(&conn);
    service.delete_categoria(id).map_err(|e| e.to_string())
}

