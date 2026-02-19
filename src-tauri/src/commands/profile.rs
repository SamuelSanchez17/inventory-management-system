use std::path::PathBuf;
use std::fs;
use tauri::State;
use crate::database;
use crate::models::Perfil;
use crate::services::perfil_service::PerfilService;

#[tauri::command]
pub fn get_perfil(db_path: State<'_, PathBuf>) -> Result<Option<Perfil>, String> {
    let db_path = db_path.inner();
    let conn = database::open_connection(db_path).map_err(|e| e.to_string())?;
    let service = PerfilService::new(&conn);
    service.get_perfil().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn save_perfil(
    nombre: String,
    cargo: String,
    image_bytes: Option<Vec<u8>>,
    image_ext: Option<String>,
    miniatura_base64: Option<String>,
    db_path: State<'_, PathBuf>,
) -> Result<(), String> {
    let db_path_ref: &PathBuf = db_path.inner();
    let conn = database::open_connection(db_path_ref).map_err(|e| e.to_string())?;
    let service = PerfilService::new(&conn);

    let mut ruta_foto: Option<String> = None;

    if let (Some(bytes), Some(ext)) = (image_bytes, image_ext) {
        let image_dir = db_path_ref
            .parent()
            .ok_or("No se pudo resolver la carpeta de imágenes")?
            .join("images");

        fs::create_dir_all(&image_dir).map_err(|e| e.to_string())?;

        // Eliminar foto anterior si existe
        if let Ok(Some(existing)) = service.get_perfil() {
            if let Some(existing_path) = existing.ruta_foto.as_deref() {
                let _ = fs::remove_file(existing_path);
            }
        }

        let filename = format!(
            "perfil_{}.{}",
            chrono::Utc::now().timestamp_millis(),
            ext
        );

        let full_path = image_dir.join(filename);
        fs::write(&full_path, bytes).map_err(|e| e.to_string())?;
        ruta_foto = Some(full_path.to_string_lossy().to_string());
    }

    service
        .save_perfil(&nombre, &cargo, ruta_foto.as_deref(), miniatura_base64.as_deref())
        .map_err(|e| e.to_string())
}
