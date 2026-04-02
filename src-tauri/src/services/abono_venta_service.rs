use rusqlite::{Connection, Error, Result};
use crate::models::{AbonoVenta, EstadoPago, RegistrarAbonoInput, TipoPago};
use crate::repos::abono_venta_repo::AbonoVentaRepo;
use crate::repos::venta_repo::VentaRepo;

pub struct AbonoVentaService<'a>
{
    pub conn: &'a Connection,
}

impl<'a> AbonoVentaService<'a>
{
    pub fn new(conn: &'a Connection) -> Self
    {
        Self { conn }
    }

    pub fn normalize_money(value: f64) -> f64
    {
        (value * 100.0).round() / 100.0
    }

    pub fn calculate_payment_status(total_abonado: f64, total_venta: f64) -> EstadoPago
    {
        if total_abonado <= 0.0 {
            EstadoPago::Pendiente
        } else if total_abonado >= total_venta {
            EstadoPago::Liquidada
        } else {
            EstadoPago::Parcial
        }
    }

    pub fn calculate_outstanding_balance(total_venta: f64, total_abonado: f64) -> f64
    {
        let total = Self::normalize_money(total_venta);
        let abonado = Self::normalize_money(total_abonado);
        let saldo = total - abonado;
        if saldo > 0.0 {
            Self::normalize_money(saldo)
        } else {
            0.0
        }
    }

    pub fn registrar_abono(&self, input: &RegistrarAbonoInput) -> Result<i64>
    {
        let monto_abono = Self::normalize_money(input.monto_abono);
        if monto_abono <= 0.0 {
            return Err(Self::business_error("El monto del abono debe ser mayor a 0"));
        }

        let venta_repo = VentaRepo { conn: self.conn };
        let venta = match venta_repo.get(input.id_venta) {
            Ok(venta) => venta,
            Err(Error::QueryReturnedNoRows) => {
                return Err(Self::business_error("La venta indicada no existe"));
            }
            Err(err) => return Err(err),
        };

        if !matches!(venta.tipo_pago, TipoPago::Abono) {
            return Err(Self::business_error("Solo se pueden registrar abonos en ventas con tipo de pago Abono"));
        }

        let total_venta = Self::normalize_money(venta.total_venta);
        let total_abonado_actual = self.obtener_total_abonado_por_venta(input.id_venta)?;
        let saldo_pendiente = Self::calculate_outstanding_balance(total_venta, total_abonado_actual);

        if monto_abono > saldo_pendiente {
            return Err(Self::business_error("El monto del abono excede el saldo pendiente"));
        }

        let fecha_abono = match input.fecha_abono.as_deref() {
            Some(fecha) if !fecha.trim().is_empty() => fecha.to_string(),
            _ => self.current_local_datetime()?,
        };

        let metodo_registro = input
            .metodo_registro
            .as_deref()
            .map(str::trim)
            .filter(|m| !m.is_empty())
            .unwrap_or("manual");

        let observacion = input
            .observacion
            .as_deref()
            .map(str::trim)
            .unwrap_or("");

        let repo = AbonoVentaRepo { conn: self.conn };
        repo.create(
            input.id_venta,
            monto_abono,
            &fecha_abono,
            metodo_registro,
            observacion,
        )
    }

    pub fn listar_abonos_por_venta(&self, id_venta: i64) -> Result<Vec<AbonoVenta>>
    {
        let repo = AbonoVentaRepo { conn: self.conn };
        let mut abonos = repo.list_by_venta(id_venta)?;
        for abono in &mut abonos {
            abono.monto_abono = Self::normalize_money(abono.monto_abono);
        }
        Ok(abonos)
    }

    pub fn obtener_total_abonado_por_venta(&self, id_venta: i64) -> Result<f64>
    {
        let repo = AbonoVentaRepo { conn: self.conn };
        let total = repo.sum_by_venta(id_venta)?;
        Ok(Self::normalize_money(total))
    }

    fn current_local_datetime(&self) -> Result<String>
    {
        self.conn.query_row(
            "SELECT datetime('now','localtime')",
            [],
            |row| row.get(0),
        )
    }

    fn business_error(message: &str) -> Error
    {
        Error::SqliteFailure(
            rusqlite::ffi::Error {
                code: rusqlite::ErrorCode::ConstraintViolation,
                extended_code: 0,
            },
            Some(message.to_string()),
        )
    }
}