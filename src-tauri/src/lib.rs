use tauri::Manager; 
use std::fs;
use std::path::PathBuf;

mod database; //para manejo de la base de datos

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      let app_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?; // crea la carpeta de datos de la app si no existe

      fs::create_dir_all(&app_dir).map_err(|e| e.to_string())?;
      let db_path = app_dir.join("inventario.db");

      println!("Ruta de la base de datos: {}", db_path.display());

      // Inicializa la base de datos (genera el archivo y aplica el esquema si es nuevo)
      database::init_db(&db_path).map_err(|e| e.to_string())?;

      // Guarda la ruta de la base de datos en el estado de la app para que
      // otros comandos puedan abrir conexiones con `database::open_connection`.
      app.manage::<PathBuf>(db_path.clone());

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}



