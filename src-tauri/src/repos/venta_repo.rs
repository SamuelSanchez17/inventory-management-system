use rusqlite::{Connection, params};
use crate::models::{Venta, TipoPago};

pub struct VentaRepo<'a> {
   pub conn: &'a Connection,
}


impl<'a> VentaRepo<'a> 
{

    pub fn list(&self) -> rusqlite::Result<Vec<Venta>> 
    {
        let mut stmt = self.conn.prepare("SELECT id_venta, fecha, nombre_clienta, total_venta, tipo_pago FROM ventas")?;

        let rows = stmt.query_map([], |row| {
            let tipo_pago_str: String = row.get(4)?;
            let tipo_pago = match tipo_pago_str.as_str() {
                "Abono" => TipoPago::Abono,
                "De Contado" => TipoPago::Contado,
                _ => TipoPago::Contado,
            };
            Ok(Venta {
                id_venta: row.get(0)?,
                fecha: row.get(1)?,
                nombre_clienta: row.get(2)?,
                total_venta: row.get(3)?,
                tipo_pago,
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
            "SELECT id_venta, fecha, nombre_clienta, total_venta, tipo_pago FROM ventas WHERE id_venta = ?1",
            params![id],
            |row| {
                let tipo_pago_str: String = row.get(4)?;
                let tipo_pago = match tipo_pago_str.as_str() {
                    "Abono" => TipoPago::Abono,
                    "De Contado" => TipoPago::Contado,
                    _ => TipoPago::Contado,
                };
                Ok(Venta {
                    id_venta: row.get(0)?,
                    fecha: row.get(1)?,
                    nombre_clienta: row.get(2)?,
                    total_venta: row.get(3)?,
                    tipo_pago,
                })
            },
        )
    }


    pub fn create(&self, fecha: &str, nombre_clienta: &str, total_venta: f64, tipo_pago: &TipoPago) -> rusqlite::Result<i64>
    {
        let tipo_pago_str = match tipo_pago {
            TipoPago::Abono => "Abono",
            TipoPago::Contado => "De Contado",
        };
        self.conn.execute(
            "INSERT INTO ventas (fecha, nombre_clienta, total_venta, tipo_pago) VALUES (?1, ?2, ?3, ?4)",
            params![fecha, nombre_clienta, total_venta, tipo_pago_str],
        )?;
        Ok(self.conn.last_insert_rowid())
    }


    pub fn update(&self, venta: &Venta) -> rusqlite::Result<()>
    {
        let tipo_pago_str = match &venta.tipo_pago {
            TipoPago::Abono => "Abono",
            TipoPago::Contado => "De Contado",
        };
        self.conn.execute(
            "UPDATE ventas SET fecha = ?1, nombre_clienta = ?2, total_venta = ?3, tipo_pago = ?4 WHERE id_venta = ?5",
            params![venta.fecha, venta.nombre_clienta, venta.total_venta, tipo_pago_str, venta.id_venta],
        )?;
        Ok(())
    }
    

    pub fn delete(&self, id: i64) -> rusqlite::Result<()>
    {
        self.conn.execute("DELETE FROM ventas WHERE id_venta = ?1", params![id])?;
        Ok(())
    }

}