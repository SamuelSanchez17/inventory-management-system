use rusqlite::{Connection, params};
use crate::models::Perfil;

pub struct PerfilRepo<'a> {
    pub conn: &'a Connection,
}

impl<'a> PerfilRepo<'a> {
    pub fn get(&self) -> rusqlite::Result<Option<Perfil>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, nombre, cargo, ruta_foto, miniatura_base64 FROM perfil WHERE id = 1"
        )?;

        let result = stmt.query_row([], |row| {
            Ok(Perfil {
                id: row.get(0)?,
                nombre: row.get(1)?,
                cargo: row.get(2)?,
                ruta_foto: row.get(3)?,
                miniatura_base64: row.get(4)?,
            })
        });

        match result {
            Ok(perfil) => Ok(Some(perfil)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e),
        }
    }

    pub fn save(
        &self,
        nombre: &str,
        cargo: &str,
        ruta_foto: Option<&str>,
        miniatura_base64: Option<&str>,
    ) -> rusqlite::Result<()> {
        self.conn.execute(
            "INSERT INTO perfil (id, nombre, cargo, ruta_foto, miniatura_base64)
             VALUES (1, ?1, ?2, ?3, ?4)
             ON CONFLICT(id) DO UPDATE SET
               nombre = excluded.nombre,
               cargo = excluded.cargo,
               ruta_foto = COALESCE(excluded.ruta_foto, perfil.ruta_foto),
               miniatura_base64 = COALESCE(excluded.miniatura_base64, perfil.miniatura_base64)",
            params![nombre, cargo, ruta_foto, miniatura_base64],
        )?;
        Ok(())
    }
}
