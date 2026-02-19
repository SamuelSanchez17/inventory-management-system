use rusqlite::{Connection, Result};
use crate::models::Perfil;
use crate::repos::perfil_repo::PerfilRepo;

pub struct PerfilService<'a> {
    pub conn: &'a Connection,
}

impl<'a> PerfilService<'a> {
    pub fn new(conn: &'a Connection) -> Self {
        Self { conn }
    }

    pub fn get_perfil(&self) -> Result<Option<Perfil>> {
        let repo = PerfilRepo { conn: self.conn };
        repo.get()
    }

    pub fn save_perfil(
        &self,
        nombre: &str,
        cargo: &str,
        ruta_foto: Option<&str>,
        miniatura_base64: Option<&str>,
    ) -> Result<()> {
        let repo = PerfilRepo { conn: self.conn };
        repo.save(nombre, cargo, ruta_foto, miniatura_base64)
    }
}
