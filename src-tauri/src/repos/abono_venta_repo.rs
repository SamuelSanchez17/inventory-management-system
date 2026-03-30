use rusqlite::{Connection, params};
use crate::models::AbonoVenta;

pub struct AbonoVentaRepo<'a>
{
    pub conn: &'a Connection,
}

impl<'a> AbonoVentaRepo<'a>
{
    pub fn create(&self, id_venta: i64, monto_abono: f64, fecha_abono: &str, metodo_registro: &str, observacion: &str) -> rusqlite::Result<i64>
    {
        self.conn.execute(
            "INSERT INTO abonos_venta (id_venta, monto_abono, fecha_abono, metodo_registro, observacion) VALUES (?1, ?2, ?3, ?4, ?5)",
            params![id_venta, monto_abono, fecha_abono, metodo_registro, observacion],
        )?;
        Ok(self.conn.last_insert_rowid())
    }

    pub fn list_by_venta(&self, id_venta: i64) -> rusqlite::Result<Vec<AbonoVenta>>
    {
        let mut stmt = self.conn.prepare(
            "SELECT id_abono, id_venta, monto_abono, fecha_abono, metodo_registro, observacion, creado_at FROM abonos_venta WHERE id_venta = ?1 ORDER BY fecha_abono DESC, id_abono DESC"
        )?;

        let rows = stmt.query_map(params![id_venta], |row| {
            Ok(AbonoVenta {
                id_abono: row.get(0)?,
                id_venta: row.get(1)?,
                monto_abono: row.get(2)?,
                fecha_abono: row.get(3)?,
                metodo_registro: row.get(4)?,
                observacion: row.get(5)?,
                creado_at: row.get(6)?,
            })
        })?;

        let mut abonos = Vec::new();
        for abono in rows
        {
            abonos.push(abono?);
        }
        Ok(abonos)
    }

    pub fn sum_by_venta(&self, id_venta: i64) -> rusqlite::Result<f64>
    {
        self.conn.query_row(
            "SELECT COALESCE(SUM(monto_abono), 0) FROM abonos_venta WHERE id_venta = ?1",
            params![id_venta],
            |row| row.get(0),
        )
    }
}