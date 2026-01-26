use rusqlite::{Connection, params};
use crate::models::Venta;

pub struct VentaRepo<'a> {
   pub conn: &'a Connection,
}


impl<'a> VentaRepo<'a> 
{

    pub fn list(&self) -> rusqlite::Result<Vec<Venta>> 
    {
        let mut stmt = self.conn.prepare("SELECT id_venta, fecha, total_venta, notas FROM ventas")?;

        let rows = stmt.query_map([], |row| {
            Ok(Venta {
                id_venta: row.get(0)?,
                fecha: row.get(1)?,
                total_venta: row.get(2)?,
                notas: row.get(3)?,
            })
        })?;

        let mut ventas = Vec::new();
        for venta in rows
        {
            ventas.push(venta?);
        }
        Ok(ventas)
    }

    pub fn get(&self, id: i64) -> rusqlite::Result<Venta> 
    {
        self.conn.query_row
        (
            "SELECT id_venta, fecha, total_venta, notas FROM ventas WHERE id_venta = ?1",
            params![id],
            |row| {
                Ok(Venta {
                    id_venta: row.get(0)?,
                    fecha: row.get(1)?,
                    total_venta: row.get(2)?,
                    notas: row.get(3)?,
                })
            },
        )
    }


    pub fn create(&self, fecha: &str, total_venta: f64, notas: Option<&str>) -> rusqlite::Result<i64>
    {
        self.conn.execute("INSERT INTO ventas (fecha, total_venta, notas) VALUES (?1, ?2, ?3)", params![fecha, total_venta, notas], )?;
        Ok(self.conn.last_insert_rowid())
    }


    pub fn update(&self, venta: &Venta) -> rusqlite::Result<()>
    {
        self.conn.execute("UPDATE ventas SET fecha = ?1, total_venta= ?2, notas = ?3 WHERE id_venta =?4", params![venta.fecha, venta.total_venta, venta.notas.as_deref(), venta.id_venta], )?;
        Ok(())
    }
    

    pub fn delete(&self, id: i64) -> rusqlite::Result<()>
    {
        self.conn.execute("DELETE FROM ventas WHERE id_venta = ?1", params![id])?;
        Ok(())
    }

}