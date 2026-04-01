use rusqlite::{Connection, Result};
use crate::models::{EstadoPago, RegistrarAbonoInput, TipoPago, Venta, VentaCobranzaView};
use crate::repos::venta_repo::VentaRepo;
use crate::services::abono_venta_service::AbonoVentaService;

pub struct VentaService<'a> {
    pub conn: &'a Connection,
}

impl <'a> VentaService<'a> {


    pub fn new(conn: &'a Connection) -> Self 
    {
        Self { conn }
    }

    pub fn list_ventas(&self) -> Result<Vec<Venta>> 
    {
        let repo = VentaRepo { conn: self.conn};
        repo.list()
    }

    pub fn get_venta(&self, id: i64) -> Result<Venta> 
    {
        let repo = VentaRepo { conn: self.conn};
        repo.get(id)
    }

    pub fn create_venta(&self, fecha: &str, nombre_clienta: &str, apellido_clienta: &str, total_venta: f64, tipo_pago: &TipoPago) -> Result<i64> 
    {
        let total_venta = AbonoVentaService::normalize_money(total_venta);
        let repo = VentaRepo { conn: self.conn};
        repo.create(fecha, nombre_clienta, apellido_clienta, total_venta, tipo_pago)
    }

    pub fn create_venta_with_initial_abono(
        &self,
        fecha: &str,
        nombre_clienta: &str,
        apellido_clienta: &str,
        total_venta: f64,
        tipo_pago: &TipoPago,
        abono_inicial: Option<f64>,
    ) -> Result<i64>
    {
        let id_venta = self.create_venta(
            fecha,
            nombre_clienta,
            apellido_clienta,
            total_venta,
            tipo_pago,
        )?;

        if matches!(tipo_pago, TipoPago::Abono) {
            if let Some(monto) = abono_inicial {
                let monto = AbonoVentaService::normalize_money(monto);
                if monto > 0.0 {
                    let abono_service = AbonoVentaService::new(self.conn);
                    let input = RegistrarAbonoInput {
                        id_venta,
                        monto_abono: monto,
                        fecha_abono: None,
                        metodo_registro: Some("inicial".to_string()),
                        observacion: Some("Abono inicial al crear venta".to_string()),
                    };
                    abono_service.registrar_abono(&input)?;
                }
            }
        }

        Ok(id_venta)
    }

    pub fn update_venta(&self, venta: &Venta) -> Result<()> 
    {
        let venta_normalizada = Venta {
            id_venta: venta.id_venta,
            fecha: venta.fecha.clone(),
            nombre_clienta: venta.nombre_clienta.clone(),
            apellido_clienta: venta.apellido_clienta.clone(),
            total_venta: AbonoVentaService::normalize_money(venta.total_venta),
            tipo_pago: venta.tipo_pago.clone(),
        };

        let repo = VentaRepo { conn: self.conn};
        repo.update(&venta_normalizada)
    }

    pub fn get_cobranza_summary(&self, id_venta: i64) -> Result<VentaCobranzaView>
    {
        let venta_repo = VentaRepo { conn: self.conn };
        let venta = venta_repo.get(id_venta)?;

        let total_venta = AbonoVentaService::normalize_money(venta.total_venta);
        let (total_abonado, saldo_pendiente, estado_pago): (f64, f64, EstadoPago) = if matches!(venta.tipo_pago, TipoPago::Contado) {
            (total_venta, 0.0, EstadoPago::Liquidada)
        } else {
            let abono_service = AbonoVentaService::new(self.conn);
            let total_abonado = abono_service.obtener_total_abonado_por_venta(id_venta)?;
            let saldo_pendiente = AbonoVentaService::calculate_outstanding_balance(total_venta, total_abonado);
            let estado_pago = AbonoVentaService::calculate_payment_status(total_abonado, total_venta);
            (total_abonado, saldo_pendiente, estado_pago)
        };

        Ok(VentaCobranzaView {
            id_venta: venta.id_venta,
            fecha: venta.fecha,
            nombre_clienta: venta.nombre_clienta,
            apellido_clienta: venta.apellido_clienta,
            total_venta,
            tipo_pago: venta.tipo_pago,
            total_abonado,
            saldo_pendiente,
            estado_pago,
        })
    }

    pub fn delete_venta(&self, id: i64) -> Result<()> 
    {
        let repo = VentaRepo { conn: self.conn};
        repo.delete(id)
    }

}