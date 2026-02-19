use std::path::Path;
use rusqlite::{Connection, Result};

//inicializa y abre la db en 'db_path'
//si el archivo no existe aplica el esquema contenido en `esquemaDB.sql`.

pub fn init_db<P: AsRef<Path>> (db_path: P) -> Result<Connection> {
    let path = db_path.as_ref();
    let is_new = !path.exists();

    let conn = Connection::open(path)?;

    // Configuracion para sqlite
    conn.execute_batch("PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;")?;

    if is_new {
        let schema = include_str!("../../esquemaDB.sql");
        conn.execute_batch(schema)?;
    }

    migrate_add_miniatura(&conn)?;
    migrate_add_nombre_producto_snapshot(&conn)?;
    migrate_add_activo(&conn)?;
    migrate_create_perfil(&conn)?;

    Ok(conn)

}

// Abre una conexión existente (sin ejecutar el esquema).
pub fn open_connection<P: AsRef<Path>>(db_path: P) -> Result<Connection> {
    let conn = Connection::open(db_path.as_ref())?;
    conn.execute_batch("PRAGMA foreign_keys = ON")?;
    Ok(conn)
}

fn ensure_column_exists(conn: &rusqlite::Connection, table: &str, column: &str) -> rusqlite::Result<bool> 
{
    let mut stmt = conn.prepare(&format!("PRAGMA table_info({})", table))?;
    let exists = stmt
        .query_map([], |row| row.get::<_, String>(1))?
        .filter_map(Result::ok)
        .any(|name| name == column);

    Ok(exists)
}

fn migrate_add_miniatura(conn: &rusqlite::Connection) -> rusqlite::Result<()> 
{
    if !ensure_column_exists(conn, "productos", "miniatura_base64")? 
    {
        conn.execute("ALTER TABLE productos ADD COLUMN miniatura_base64 TEXT", [])?;
    }
    Ok(())
}

fn migrate_add_nombre_producto_snapshot(conn: &rusqlite::Connection) -> rusqlite::Result<()> 
{
    if !ensure_column_exists(conn, "productos_vendidos", "nombre_producto_snapshot")? 
    {
        conn.execute("ALTER TABLE productos_vendidos ADD COLUMN nombre_producto_snapshot TEXT NOT NULL DEFAULT ''", [])?;
        // Rellenar registros existentes con el nombre actual del producto
        conn.execute(
            "UPDATE productos_vendidos SET nombre_producto_snapshot = (SELECT nombre_producto FROM productos WHERE productos.id_producto = productos_vendidos.id_producto) WHERE nombre_producto_snapshot = ''",
            [],
        )?;
    }
    Ok(())
}

fn migrate_add_activo(conn: &rusqlite::Connection) -> rusqlite::Result<()>
{
    if !ensure_column_exists(conn, "productos", "activo")?
    {
        conn.execute("ALTER TABLE productos ADD COLUMN activo INTEGER NOT NULL DEFAULT 1", [])?;
    }
    Ok(())
}

fn migrate_create_perfil(conn: &rusqlite::Connection) -> rusqlite::Result<()>
{
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS perfil (
            id INTEGER PRIMARY KEY,
            nombre TEXT NOT NULL DEFAULT '',
            cargo TEXT NOT NULL DEFAULT '',
            ruta_foto TEXT,
            miniatura_base64 TEXT
        );"
    )?;
    Ok(())
}

