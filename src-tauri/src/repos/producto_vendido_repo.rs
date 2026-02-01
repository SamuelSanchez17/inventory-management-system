use rusqlite::{Connection, params};
use crate::models::ProductoVendido;

pub struct ProductoVendidoRepo<'a> 
{
    pub conn: &'a Connection,
}

impl<'a> ProductoVendidoRepo<'a> 
{
    
    // Listar todos los productos vendidos
    pub fn list(&self) -> rusqlite::Result<Vec<ProductoVendido>> 
    {
        let mut stmt = self.conn.prepare(
            "SELECT id_producto_vendido, id_venta, id_producto, cantidad, precio_unitario, subtotal FROM productos_vendidos"
        )?;

        let rows = stmt.query_map([], |row| {
            Ok(ProductoVendido {
                id_producto_vendido: row.get(0)?,
                id_venta: row.get(1)?,
                id_producto: row.get(2)?,
                cantidad: row.get(3)?,
                precio_unitario: row.get(4)?,
                subtotal: row.get(5)?,
            })
        })?;

        let mut productos_vendidos = Vec::new();
        for producto_vendido in rows {
            productos_vendidos.push(producto_vendido?);
        }
        Ok(productos_vendidos)
    }

    // Obtener un producto vendido por ID
    pub fn get(&self, id: i64) -> rusqlite::Result<ProductoVendido> 
    {
        self.conn.query_row(
            "SELECT id_producto_vendido, id_venta, id_producto, cantidad, precio_unitario, subtotal FROM productos_vendidos WHERE id_producto_vendido = ?1",
            params![id],
            |row| {
                Ok(ProductoVendido {
                    id_producto_vendido: row.get(0)?,
                    id_venta: row.get(1)?,
                    id_producto: row.get(2)?,
                    cantidad: row.get(3)?,
                    precio_unitario: row.get(4)?,
                    subtotal: row.get(5)?,
                })
            },
        )
    }

    // Obtener todos los productos de una venta específica
    pub fn get_by_venta(&self, id_venta: i64) -> rusqlite::Result<Vec<ProductoVendido>> 
    {
        let mut stmt = self.conn.prepare(
            "SELECT id_producto_vendido, id_venta, id_producto, cantidad, precio_unitario, subtotal FROM productos_vendidos WHERE id_venta = ?1"
        )?;

        let rows = stmt.query_map(params![id_venta], |row| {
            Ok(ProductoVendido {
                id_producto_vendido: row.get(0)?,
                id_venta: row.get(1)?,
                id_producto: row.get(2)?,
                cantidad: row.get(3)?,
                precio_unitario: row.get(4)?,
                subtotal: row.get(5)?,
            })
        })?;

        let mut productos_vendidos = Vec::new();
        for producto_vendido in rows {
            productos_vendidos.push(producto_vendido?);
        }
        Ok(productos_vendidos)
    }

    // Crear un producto vendido
    pub fn create(&self, id_venta: i64, id_producto: i64, cantidad: i64, precio_unitario: f64, subtotal: f64) -> rusqlite::Result<i64> 
    {
        self.conn.execute(
            "INSERT INTO productos_vendidos (id_venta, id_producto, cantidad, precio_unitario, subtotal) VALUES (?1, ?2, ?3, ?4, ?5)",
            params![id_venta, id_producto, cantidad, precio_unitario, subtotal],
        )?;
        Ok(self.conn.last_insert_rowid())
    }

    // Actualizar un producto vendido
    pub fn update(&self, producto_vendido: &ProductoVendido) -> rusqlite::Result<()> 
    {
        self.conn.execute(
            "UPDATE productos_vendidos SET id_venta = ?1, id_producto = ?2, cantidad = ?3, precio_unitario = ?4, subtotal = ?5 WHERE id_producto_vendido = ?6",
            params![
                producto_vendido.id_venta,
                producto_vendido.id_producto,
                producto_vendido.cantidad,
                producto_vendido.precio_unitario,
                producto_vendido.subtotal,
                producto_vendido.id_producto_vendido,
            ],
        )?;
        Ok(())
    }

    // Eliminar un producto vendido
    pub fn delete(&self, id: i64) -> rusqlite::Result<()> 
    {
        self.conn.execute("DELETE FROM productos_vendidos WHERE id_producto_vendido = ?1", params![id])?;
        Ok(())
    }

    // Eliminar todos los productos de una venta
    pub fn delete_by_venta(&self, id_venta: i64) -> rusqlite::Result<()> 
    {
        self.conn.execute("DELETE FROM productos_vendidos WHERE id_venta = ?1", params![id_venta])?;
        Ok(())
    }
}
