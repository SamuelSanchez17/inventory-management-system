use rusqlite::{Connection, params};
use crate::models::Producto;

pub struct ProductoRepo<'a> {
    pub conn : &'a Connection,
}

//métodos CRUD (create, update, delete)

impl<'a> ProductoRepo<'a> {
    pub fn list(&self) -> rusqlite::Result<Vec<Producto>> {
        let mut stmt = self.conn.prepare("SELECT id_producto, nombre_producto, id_categoria, ruta_imagen, miniatura_base64, stock, precio, precio_consultora, precio_publico, creado_at, actualizado_at, activo FROM productos WHERE activo = 1")?;

        let rows = stmt.query_map([], |row| {
            Ok(Producto {
                id_producto: row.get(0)?,
                nombre_producto: row.get(1)?,
                id_categoria: row.get(2)?,
                ruta_imagen: row.get(3)?,
                miniatura_base64: row.get(4)?,
                stock: row.get(5)?,
                precio: row.get(6)?,
                precio_consultora: row.get(7)?,
                precio_publico: row.get(8)?,
                creado_at: row.get(9)?,
                actualizado_at: row.get(10)?,
                activo: row.get(11)?,
            })
        })?;
        let mut productos = Vec::new();
        for producto in rows {
            productos.push(producto?);
        }
        Ok(productos)
    }

    //get
    pub fn get(&self, id: i64) -> rusqlite::Result<Producto> {
        self.conn.query_row(
            "SELECT id_producto, nombre_producto, id_categoria, ruta_imagen, miniatura_base64, stock, precio, precio_consultora, precio_publico, creado_at, actualizado_at, activo FROM productos WHERE id_producto = ?1",
            params![id],
            |row| {
                Ok(Producto {
                    id_producto: row.get(0)?,
                    nombre_producto: row.get(1)?,
                    id_categoria: row.get(2)?,
                    ruta_imagen: row.get(3)?,
                    miniatura_base64: row.get(4)?,
                    stock: row.get(5)?,
                    precio: row.get(6)?,
                    precio_consultora: row.get(7)?,
                    precio_publico: row.get(8)?,
                    creado_at: row.get(9)?,
                    actualizado_at: row.get(10)?,
                    activo: row.get(11)?,
                })
            },
        )
    }

    //create
    pub fn create(&self, nombre_producto: &str, id_categoria: Option<i64>, ruta_imagen: Option<&str>, miniatura_base64: Option<&str>, stock: i64, precio: f64) -> rusqlite::Result<i64> {
        self.conn.execute(
            "INSERT INTO productos (nombre_producto, id_categoria, ruta_imagen, miniatura_base64, stock, precio, precio_consultora, precio_publico, creado_at, actualizado_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?6, ?6, datetime('now'), datetime('now'))",
            params![nombre_producto, id_categoria, ruta_imagen, miniatura_base64, stock, precio],
        )?;
        Ok(self.conn.last_insert_rowid())
    }

    //update
    pub fn update(&self, producto: &Producto) -> rusqlite::Result<()> {
        self.conn.execute(
            "UPDATE productos
             SET nombre_producto = ?1,
                 id_categoria = ?2,
                 ruta_imagen = ?3,
                 miniatura_base64 = ?4,
                 stock = ?5,
                 precio = ?6,
                 precio_consultora = CASE WHEN ?7 > 0 THEN ?7 ELSE ?6 END,
                 precio_publico = CASE WHEN ?8 > 0 THEN ?8 ELSE ?6 END,
                 actualizado_at = datetime('now')
             WHERE id_producto = ?9",
            params![
                producto.nombre_producto,
                producto.id_categoria,
                producto.ruta_imagen.as_deref(),
                producto.miniatura_base64.as_deref(),
                producto.stock,
                producto.precio,
                producto.precio_consultora,
                producto.precio_publico,
                producto.id_producto,
            ],
        )?;
        Ok(())
    }

    //soft delete (marca como producto descontinuado)
    pub fn delete(&self, id: i64) -> rusqlite::Result<()> {
        self.conn.execute("UPDATE productos SET activo = 0, actualizado_at = datetime('now','localtime') WHERE id_producto = ?1", params![id])?;
        Ok(())
    }

}
