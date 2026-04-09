use rusqlite::{Connection, Result};
use crate::repos::producto_repo::ProductoRepo;
use crate::models::Producto;

pub struct ProductoService<'a> {
    pub conn: &'a Connection,
}

impl <'a> ProductoService<'a> 
{
   pub fn new(conn: &'a Connection) -> Self 
   {
    Self { conn } 
   }

   pub fn list_productos(&self) -> Result<Vec<Producto>> 
   {
    let repo = ProductoRepo {conn: self.conn};
    repo.list()
   }

   pub fn get_producto(&self, id: i64) -> Result<Producto> 
   {
    let repo = ProductoRepo {conn: self.conn};
    repo.get(id)
   }

   pub fn create_producto(&self, nombre_producto: &str, id_categoria: Option<i64>, ruta_imagen: Option<&str>, miniatura_base64: Option<&str>,stock: i64, precio: f64) -> Result<i64> 
   {
    self.validate_prices(stock, precio, precio)?;
    let repo = ProductoRepo {conn: self.conn};
    repo.create(nombre_producto, id_categoria, ruta_imagen, miniatura_base64, stock, precio)
   }

   pub fn create_producto_with_prices(
    &self,
    nombre_producto: &str,
    id_categoria: Option<i64>,
    ruta_imagen: Option<&str>,
    miniatura_base64: Option<&str>,
    stock: i64,
    precio_consultora: f64,
    precio_publico: f64,
   ) -> Result<i64>
   {
    self.validate_prices(stock, precio_consultora, precio_publico)?;
    let repo = ProductoRepo {conn: self.conn};
    repo.create_with_prices(
        nombre_producto,
        id_categoria,
        ruta_imagen,
        miniatura_base64,
        stock,
        precio_publico,
        precio_consultora,
        precio_publico,
    )
   }

   pub fn update_producto(&self, producto: &Producto) -> Result<()> 
   {
    let mut normalized = producto.clone();
    self.normalize_product_prices(&mut normalized);
    self.validate_prices(normalized.stock, normalized.precio_consultora, normalized.precio_publico)?;

    let repo = ProductoRepo {conn: self.conn};
    repo.update(&normalized)
   }

   pub fn delete_producto(&self, id: i64) -> Result<()> 
   {
    let repo = ProductoRepo {conn: self.conn};
    repo.delete(id)
   }

   pub fn get_total_inventory_value(&self) -> Result<f64>
   {
    let products = self.list_productos()?;
    let total = products
        .iter()
        .fold(0.0_f64, |acc, p| {
            let base_price = if p.precio_consultora > 0.0 {
                p.precio_consultora
            } else {
                p.precio
            };
            acc + (p.stock as f64 * base_price)
        });
    Ok(total)
   }

   fn normalize_product_prices(&self, producto: &mut Producto)
   {
    if producto.precio_consultora <= 0.0 {
        producto.precio_consultora = if producto.precio > 0.0 { producto.precio } else { 0.0 };
    }

    if producto.precio_publico <= 0.0 {
        producto.precio_publico = if producto.precio > 0.0 {
            producto.precio
        } else {
            producto.precio_consultora
        };
    }

    if producto.precio_publico < producto.precio_consultora {
        producto.precio_publico = producto.precio_consultora;
    }

    // Keep legacy field aligned while old frontend/backend paths still depend on it.
    producto.precio = producto.precio_publico;
   }

   fn validate_prices(&self, stock: i64, precio_consultora: f64, precio_publico: f64) -> Result<()>
   {
    if stock < 0 {
        return Err(rusqlite::Error::InvalidParameterName(
            "stock no puede ser negativo".to_string(),
        ));
    }

    if precio_consultora < 0.0 {
        return Err(rusqlite::Error::InvalidParameterName(
            "precio_consultora no puede ser negativo".to_string(),
        ));
    }

    if precio_publico < 0.0 {
        return Err(rusqlite::Error::InvalidParameterName(
            "precio_publico no puede ser negativo".to_string(),
        ));
    }

    if precio_publico < precio_consultora {
        return Err(rusqlite::Error::InvalidParameterName(
            "precio_publico debe ser mayor o igual a precio_consultora".to_string(),
        ));
    }

    Ok(())
   }


}