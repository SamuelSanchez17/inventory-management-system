use tauri::Manager; 
use std::fs;
use std::path::PathBuf;
use commands::products;
use commands::categories;
use commands::sales;
use commands::sold_products;

mod database; //para manejo de la base de datos
mod models; //definicion de modelo de datos
mod repos; //repositorios para acceso a datos
mod services; //lógica de negocio
mod commands; //comandos expuestos a la interfaz


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

      // Crea la carpeta para las imágenes del proyecto si no existe
      let images_dir = app_dir.join("images");
      std::fs::create_dir_all(&images_dir).map_err(|e| e.to_string())?;
      println!("Ruta de la carpeta de imágenes: {}", images_dir.display());

      // Inicializa la base de datos (genera el archivo y aplica el esquema si es nuevo)
      database::init_db(&db_path).map_err(|e| e.to_string())?;

      // Guarda la ruta de la base de datos en el estado de la app para que
      app.manage::<PathBuf>(db_path.clone());

      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      products::list_productos,
      products::get_producto,
      products::create_producto,
      products::update_producto,
      products::delete_producto,

      categories::list_categorias,
      categories::get_categoria,
      categories::create_categoria,
      categories::update_categoria,
      categories::delete_categoria,

      sales::list_ventas,
      sales::get_venta,
      sales::create_venta,
      sales::update_venta,
      sales::delete_venta,
      sales::create_venta_completa,
      sales::get_sales_today,
      sales::get_sales_month,

      sold_products::list_productos_vendidos,
      sold_products::get_producto_vendido,
      sold_products::get_productos_by_venta,
      sold_products::create_producto_vendido,
      sold_products::update_producto_vendido,
      sold_products::delete_producto_vendido,
      sold_products::delete_productos_by_venta,

    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}



