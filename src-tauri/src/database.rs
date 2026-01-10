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

    Ok(conn)

}

/// Abre una conexión existente (sin ejecutar el esquema).
pub fn open_connection<P: AsRef<Path>>(db_path: P) -> Result<Connection> {
    let conn = Connection::open(db_path.as_ref())?;
    conn.execute_batch("PRAGMA foreign_keys = ON")?;
    Ok(conn)
}

