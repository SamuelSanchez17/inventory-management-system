use app_lib::database;
use app_lib::models::{RegistrarAbonoInput, TipoPago};
use app_lib::services::abono_venta_service::AbonoVentaService;
use app_lib::services::venta_service::VentaService;
use rusqlite::Connection;
use std::fs;
use std::path::PathBuf;
use uuid::Uuid;

struct TestDb {
    path: PathBuf,
    conn: Connection,
}

impl TestDb {
    fn new() -> Self {
        let path = std::env::temp_dir().join(format!("inventario-mk-test-{}.sqlite", Uuid::new_v4()));
        let conn = database::init_db(&path).expect("debe inicializar db de prueba");
        Self { path, conn }
    }
}

impl Drop for TestDb {
    fn drop(&mut self) {
        let wal = self.path.with_extension("sqlite-wal");
        let shm = self.path.with_extension("sqlite-shm");
        let _ = fs::remove_file(&wal);
        let _ = fs::remove_file(&shm);
        let _ = fs::remove_file(&self.path);
    }
}

#[test]
fn venta_contado_se_refleja_liquidada_y_saldo_cero() {
    let db = TestDb::new();
    let venta_service = VentaService::new(&db.conn);

    let id_venta = venta_service
        .create_venta(
            "2026-03-20",
            "Ana",
            "Perez",
            150.0,
            &TipoPago::Contado,
        )
        .expect("debe crear venta de contado");

    let resumen = venta_service
        .get_cobranza_summary(id_venta)
        .expect("debe obtener resumen de cobranza");

    assert!((resumen.total_abonado - 150.0).abs() < 0.0001);
    assert!((resumen.saldo_pendiente - 0.0).abs() < 0.0001);
    assert!(matches!(resumen.estado_pago, app_lib::models::EstadoPago::Liquidada));
}

#[test]
fn registrar_abono_rechaza_monto_no_positivo_y_sobrepago() {
    let db = TestDb::new();
    let venta_service = VentaService::new(&db.conn);
    let abono_service = AbonoVentaService::new(&db.conn);

    let id_venta = venta_service
        .create_venta(
            "2026-03-20",
            "Bea",
            "Lopez",
            100.0,
            &TipoPago::Abono,
        )
        .expect("debe crear venta tipo abono");

    let err_no_positivo = abono_service
        .registrar_abono(&RegistrarAbonoInput {
            id_venta,
            monto_abono: 0.0,
            fecha_abono: Some("2026-03-20 10:00:00".to_string()),
            metodo_registro: Some("manual".to_string()),
            observacion: Some("test".to_string()),
        })
        .expect_err("monto cero debe fallar");

    assert!(err_no_positivo.to_string().contains("mayor a 0"));

    let err_sobrepago = abono_service
        .registrar_abono(&RegistrarAbonoInput {
            id_venta,
            monto_abono: 150.0,
            fecha_abono: Some("2026-03-20 11:00:00".to_string()),
            metodo_registro: Some("manual".to_string()),
            observacion: Some("test".to_string()),
        })
        .expect_err("sobrepago debe fallar");

    assert!(err_sobrepago.to_string().contains("excede el saldo pendiente"));
}

#[test]
fn registrar_abono_rechaza_venta_de_contado() {
    let db = TestDb::new();
    let venta_service = VentaService::new(&db.conn);
    let abono_service = AbonoVentaService::new(&db.conn);

    let id_venta = venta_service
        .create_venta(
            "2026-03-21",
            "Caro",
            "Diaz",
            120.0,
            &TipoPago::Contado,
        )
        .expect("debe crear venta de contado");

    let err = abono_service
        .registrar_abono(&RegistrarAbonoInput {
            id_venta,
            monto_abono: 20.0,
            fecha_abono: Some("2026-03-21 09:00:00".to_string()),
            metodo_registro: Some("manual".to_string()),
            observacion: Some("test".to_string()),
        })
        .expect_err("no debe permitir abonos en contado");

    assert!(err
        .to_string()
        .contains("Solo se pueden registrar abonos en ventas con tipo de pago Abono"));
}

#[test]
fn flujo_abonos_multiples_actualiza_total_saldo_y_estado() {
    let db = TestDb::new();
    let venta_service = VentaService::new(&db.conn);
    let abono_service = AbonoVentaService::new(&db.conn);

    let id_venta = venta_service
        .create_venta_with_initial_abono(
            "2026-03-22",
            "Dani",
            "Ruiz",
            100.0,
            &TipoPago::Abono,
            Some(30.0),
        )
        .expect("debe crear venta con abono inicial");

    let resumen_1 = venta_service
        .get_cobranza_summary(id_venta)
        .expect("debe obtener resumen inicial");
    assert!((resumen_1.total_abonado - 30.0).abs() < 0.0001);
    assert!((resumen_1.saldo_pendiente - 70.0).abs() < 0.0001);
    assert!(matches!(resumen_1.estado_pago, app_lib::models::EstadoPago::Parcial));

    abono_service
        .registrar_abono(&RegistrarAbonoInput {
            id_venta,
            monto_abono: 40.0,
            fecha_abono: Some("2026-03-23 08:00:00".to_string()),
            metodo_registro: Some("manual".to_string()),
            observacion: Some("segunda cuota".to_string()),
        })
        .expect("debe registrar abono adicional");

    let resumen_2 = venta_service
        .get_cobranza_summary(id_venta)
        .expect("debe obtener resumen parcial");
    assert!((resumen_2.total_abonado - 70.0).abs() < 0.0001);
    assert!((resumen_2.saldo_pendiente - 30.0).abs() < 0.0001);
    assert!(matches!(resumen_2.estado_pago, app_lib::models::EstadoPago::Parcial));

    abono_service
        .registrar_abono(&RegistrarAbonoInput {
            id_venta,
            monto_abono: 30.0,
            fecha_abono: Some("2026-03-24 08:00:00".to_string()),
            metodo_registro: Some("manual".to_string()),
            observacion: Some("ultima cuota".to_string()),
        })
        .expect("debe liquidar la venta");

    let resumen_3 = venta_service
        .get_cobranza_summary(id_venta)
        .expect("debe obtener resumen liquidado");
    assert!((resumen_3.total_abonado - 100.0).abs() < 0.0001);
    assert!((resumen_3.saldo_pendiente - 0.0).abs() < 0.0001);
    assert!(matches!(resumen_3.estado_pago, app_lib::models::EstadoPago::Liquidada));
}
