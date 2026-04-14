use app_lib::database;
use app_lib::services::producto_service::ProductoService;
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
fn crear_producto_con_precios_duales_persiste_campos_correctos() {
    let db = TestDb::new();
    let service = ProductoService::new(&db.conn);

    let id = service
        .create_producto_with_prices(
            "Shampoo",
            None,
            None,
            None,
            4,
            70.0,
            100.0,
        )
        .expect("debe crear producto con dual-price");

    let producto = service
        .get_producto(id)
        .expect("debe obtener producto creado");

    assert!((producto.precio_consultora - 70.0).abs() < 0.0001);
    assert!((producto.precio_publico - 100.0).abs() < 0.0001);
    assert!((producto.precio - 100.0).abs() < 0.0001);
}

#[test]
fn crear_producto_rechaza_precio_publico_menor_a_consultora() {
    let db = TestDb::new();
    let service = ProductoService::new(&db.conn);

    let err = service
        .create_producto_with_prices(
            "Crema",
            None,
            None,
            None,
            3,
            90.0,
            80.0,
        )
        .expect_err("debe rechazar precios invalidos");

    assert!(
        err.to_string()
            .contains("precio_publico debe ser mayor o igual a precio_consultora")
    );
}

#[test]
fn inventario_total_usa_precio_consultora_como_base() {
    let db = TestDb::new();
    let service = ProductoService::new(&db.conn);

    service
        .create_producto_with_prices("A", None, None, None, 2, 50.0, 80.0)
        .expect("debe crear producto A");
    service
        .create_producto_with_prices("B", None, None, None, 3, 20.0, 35.0)
        .expect("debe crear producto B");

    let total = service
        .get_total_inventory_value()
        .expect("debe calcular inventario total");

    // 2*50 + 3*20 = 160
    assert!((total - 160.0).abs() < 0.0001);
}

#[test]
fn update_normaliza_precios_y_sincroniza_precio_legacy() {
    let db = TestDb::new();
    let service = ProductoService::new(&db.conn);

    let id = service
        .create_producto("Acondicionador", None, None, None, 5, 120.0)
        .expect("debe crear producto legacy");

    let mut producto = service.get_producto(id).expect("debe obtener producto");
    producto.precio = 150.0;
    producto.precio_consultora = 0.0;
    producto.precio_publico = 0.0;

    service
        .update_producto(&producto)
        .expect("debe actualizar y normalizar precios");

    let actualizado = service
        .get_producto(id)
        .expect("debe obtener producto actualizado");

    assert!((actualizado.precio_publico - 150.0).abs() < 0.0001);
    assert!((actualizado.precio_consultora - 150.0).abs() < 0.0001);
    assert!((actualizado.precio - 150.0).abs() < 0.0001);
}
