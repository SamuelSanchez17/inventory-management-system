use rusqlite::{Connection, params};
use crate::models::{EstadoPago, TipoPago, Venta, VentaCobranzaView};

pub struct VentaRepo<'a> {
   pub conn: &'a Connection,
}


impl<'a> VentaRepo<'a> 
{

    pub fn list_with_cobranza(&self) -> rusqlite::Result<Vec<VentaCobranzaView>>
    {
        let mut stmt = self.conn.prepare(
            "SELECT \
                ventas.id_venta, \
                ventas.fecha, \
                ventas.nombre_clienta, \
                ventas.apellido_clienta, \
                ventas.total_venta, \
                ventas.tipo_pago, \
                COALESCE(SUM(abonos_venta.monto_abono), 0) AS total_abonado, \
                CASE \
                    WHEN (ventas.total_venta - COALESCE(SUM(abonos_venta.monto_abono), 0)) > 0 \
                    THEN (ventas.total_venta - COALESCE(SUM(abonos_venta.monto_abono), 0)) \
                    ELSE 0 \
                END AS saldo_pendiente \
            FROM ventas \
            LEFT JOIN abonos_venta ON abonos_venta.id_venta = ventas.id_venta \
            GROUP BY \
                ventas.id_venta, \
                ventas.fecha, \
                ventas.nombre_clienta, \
                ventas.apellido_clienta, \
                ventas.total_venta, \
                ventas.tipo_pago"
        )?;

        let rows = stmt.query_map([], |row| {
            let tipo_pago_str: String = row.get(5)?;
            let tipo_pago = match tipo_pago_str.as_str() {
                "Abono" => TipoPago::Abono,
                "De Contado" => TipoPago::Contado,
                _ => TipoPago::Contado,
            };

            let total_venta: f64 = row.get(4)?;
            let total_abonado_db: f64 = row.get(6)?;
            let saldo_pendiente_db: f64 = row.get(7)?;

            let (total_abonado, saldo_pendiente, estado_pago) = match tipo_pago {
                TipoPago::Contado => (total_venta, 0.0, EstadoPago::Liquidada),
                TipoPago::Abono => {
                    let estado = if total_abonado_db <= 0.0 {
                        EstadoPago::Pendiente
                    } else if total_abonado_db >= total_venta {
                        EstadoPago::Liquidada
                    } else {
                        EstadoPago::Parcial
                    };
                    (total_abonado_db, saldo_pendiente_db, estado)
                }
            };

            Ok(VentaCobranzaView {
                id_venta: row.get(0)?,
                fecha: row.get(1)?,
                nombre_clienta: row.get(2)?,
                apellido_clienta: row.get(3)?,
                total_venta,
                tipo_pago,
                total_abonado,
                saldo_pendiente,
                estado_pago,
            })
        })?;

        let mut ventas = Vec::new();
        for venta in rows
        {
            ventas.push(venta?);
        }
        Ok(ventas)
    }

    pub fn list(&self) -> rusqlite::Result<Vec<Venta>> 
    {
        let mut stmt = self.conn.prepare("SELECT id_venta, fecha, nombre_clienta, apellido_clienta, total_venta, tipo_pago FROM ventas")?;

        let rows = stmt.query_map([], |row| {
            let tipo_pago_str: String = row.get(5)?;
            let tipo_pago = match tipo_pago_str.as_str() {
                "Abono" => TipoPago::Abono,
                "De Contado" => TipoPago::Contado,
                _ => TipoPago::Contado,
            };
            Ok(Venta {
                id_venta: row.get(0)?,
                fecha: row.get(1)?,
                nombre_clienta: row.get(2)?,
                apellido_clienta: row.get(3)?,
                total_venta: row.get(4)?,
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
            "SELECT id_venta, fecha, nombre_clienta, apellido_clienta, total_venta, tipo_pago FROM ventas WHERE id_venta = ?1",
            params![id],
            |row| {
                let tipo_pago_str: String = row.get(5)?;
                let tipo_pago = match tipo_pago_str.as_str() {
                    "Abono" => TipoPago::Abono,
                    "De Contado" => TipoPago::Contado,
                    _ => TipoPago::Contado,
                };
                Ok(Venta {
                    id_venta: row.get(0)?,
                    fecha: row.get(1)?,
                    nombre_clienta: row.get(2)?,
                    apellido_clienta: row.get(3)?,
                    total_venta: row.get(4)?,
                    tipo_pago,
                })
            },
        )
    }


    pub fn create(&self, fecha: &str, nombre_clienta: &str, apellido_clienta: &str, total_venta: f64, tipo_pago: &TipoPago) -> rusqlite::Result<i64>
    {
        let tipo_pago_str = match tipo_pago {
            TipoPago::Abono => "Abono",
            TipoPago::Contado => "De Contado",
        };
        self.conn.execute(
            "INSERT INTO ventas (fecha, nombre_clienta, apellido_clienta, total_venta, tipo_pago) VALUES (?1, ?2, ?3, ?4, ?5)",
            params![fecha, nombre_clienta, apellido_clienta, total_venta, tipo_pago_str],
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
            "UPDATE ventas SET fecha = ?1, nombre_clienta = ?2, apellido_clienta = ?3, total_venta = ?4, tipo_pago = ?5 WHERE id_venta = ?6",
            params![venta.fecha, venta.nombre_clienta, venta.apellido_clienta, venta.total_venta, tipo_pago_str, venta.id_venta],
        )?;
        Ok(())
    }
    

    pub fn delete(&self, id: i64) -> rusqlite::Result<()>
    {
        self.conn.execute("DELETE FROM ventas WHERE id_venta = ?1", params![id])?;
        Ok(())
    }

}