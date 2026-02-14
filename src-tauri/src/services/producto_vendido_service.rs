use rusqlite::{Connection, Result};
use crate::repos::producto_vendido_repo::ProductoVendidoRepo;
use crate::models::ProductoVendido;

pub struct ProductoVendidoService<'a> 
{
    pub conn: &'a Connection,
}

impl<'a> ProductoVendidoService<'a> 
{
    
    pub fn new(conn: &'a Connection) -> Self 
    {
        Self { conn }
    }

    pub fn list_productos_vendidos(&self) -> Result<Vec<ProductoVendido>> 
    {
        let repo = ProductoVendidoRepo { conn: self.conn };
        repo.list()
    }

    pub fn get_producto_vendido(&self, id: i64) -> Result<ProductoVendido> 
    {
        let repo = ProductoVendidoRepo { conn: self.conn };
        repo.get(id)
    }

    pub fn get_productos_by_venta(&self, id_venta: i64) -> Result<Vec<ProductoVendido>> 
    {
        let repo = ProductoVendidoRepo { conn: self.conn };
        repo.get_by_venta(id_venta)
    }

    pub fn create_producto_vendido(&self, id_venta: i64, id_producto: i64, nombre_producto_snapshot: &str, cantidad: i64, precio_unitario: f64, subtotal: f64) -> Result<i64> 
    {
        let repo = ProductoVendidoRepo { conn: self.conn };
        repo.create(id_venta, id_producto, nombre_producto_snapshot, cantidad, precio_unitario, subtotal)
    }

    pub fn update_producto_vendido(&self, producto_vendido: &ProductoVendido) -> Result<()> 
    {
        let repo = ProductoVendidoRepo { conn: self.conn };
        repo.update(producto_vendido)
    }

    pub fn delete_producto_vendido(&self, id: i64) -> Result<()> 
    {
        let repo = ProductoVendidoRepo { conn: self.conn };
        repo.delete(id)
    }

    pub fn delete_productos_by_venta(&self, id_venta: i64) -> Result<()> 
    {
        let repo = ProductoVendidoRepo { conn: self.conn };
        repo.delete_by_venta(id_venta)
    }
}
