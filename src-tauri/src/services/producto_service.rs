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
    let repo = ProductoRepo {conn: self.conn};
    repo.create(nombre_producto, id_categoria, ruta_imagen, miniatura_base64, stock, precio)
   }

   pub fn update_producto(&self, producto: &Producto) -> Result<()> 
   {
    let repo = ProductoRepo {conn: self.conn};
    repo.update(producto)
   }

   pub fn delete_producto(&self, id: i64) -> Result<()> 
   {
    let repo = ProductoRepo {conn: self.conn};
    repo.delete(id)
   }


}