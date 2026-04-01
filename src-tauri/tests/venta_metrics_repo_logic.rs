use app_lib::commands::sales::get_sales_total_between_dates;
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
fn semanal_aplica_logica_mixta_contado_por_fecha_venta_y_abono_por_fecha_abono() {
    let db = TestDb::new();
    let venta_service = VentaService::new(&db.conn);
    let abono_service = AbonoVentaService::new(&db.conn);

    venta_service
        .create_venta(
            "2026-03-10",
            "Eva",
            "Mora",
            200.0,
            &TipoPago::Contado,
        )
        .expect("debe crear contado dentro de rango");

    let id_venta_abono = venta_service
        .create_venta(
            "2026-03-01",
            "Fabi",
            "Nunez",
            500.0,
            &TipoPago::Abono,
        )
        .expect("debe crear venta a abono");

    abono_service
        .registrar_abono(&RegistrarAbonoInput {
            id_venta: id_venta_abono,
            monto_abono: 80.0,
            fecha_abono: Some("2026-03-10 10:00:00".to_string()),
            metodo_registro: Some("manual".to_string()),
            observacion: Some("semana".to_string()),
        })
        .expect("debe registrar abono en rango semanal");

    abono_service
        .registrar_abono(&RegistrarAbonoInput {
            id_venta: id_venta_abono,
            monto_abono: 25.0,
            fecha_abono: Some("2026-03-03 10:00:00".to_string()),
            metodo_registro: Some("manual".to_string()),
            observacion: Some("fuera de semana".to_string()),
        })
        .expect("debe registrar abono fuera de rango semanal");

    let total = get_sales_total_between_dates(&db.conn, "2026-03-08", "2026-03-14")
        .expect("debe calcular total semanal");

    assert!((total - 280.0).abs() < 0.0001);
}

#[test]
fn mensual_suma_contado_por_fecha_venta_y_abonos_por_fecha_abono() {
    let db = TestDb::new();
    let venta_service = VentaService::new(&db.conn);
    let abono_service = AbonoVentaService::new(&db.conn);

    venta_service
        .create_venta(
            "2026-03-12",
            "Gabi",
            "Soto",
            150.0,
            &TipoPago::Contado,
        )
        .expect("debe crear contado dentro de mes");

    venta_service
        .create_venta(
            "2026-02-25",
            "Hana",
            "Luna",
            90.0,
            &TipoPago::Contado,
        )
        .expect("debe crear contado fuera del mes");

    let id_venta_abono = venta_service
        .create_venta(
            "2026-02-20",
            "Ines",
            "Rios",
            300.0,
            &TipoPago::Abono,
        )
        .expect("debe crear venta a abono");

    abono_service
        .registrar_abono(&RegistrarAbonoInput {
            id_venta: id_venta_abono,
            monto_abono: 70.0,
            fecha_abono: Some("2026-03-05 11:00:00".to_string()),
            metodo_registro: Some("manual".to_string()),
            observacion: Some("mes vigente".to_string()),
        })
        .expect("debe registrar abono dentro de mes");

    abono_service
        .registrar_abono(&RegistrarAbonoInput {
            id_venta: id_venta_abono,
            monto_abono: 30.0,
            fecha_abono: Some("2026-04-01 11:00:00".to_string()),
            metodo_registro: Some("manual".to_string()),
            observacion: Some("fuera de mes".to_string()),
        })
        .expect("debe registrar abono fuera de mes");

    let total = get_sales_total_between_dates(&db.conn, "2026-03-01", "2026-03-31")
        .expect("debe calcular total mensual");

    assert!((total - 220.0).abs() < 0.0001);
}
