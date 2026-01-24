use rusqlite::{Connection, Result};
use crate::models::Categoria;
use crate::repos::categoria_repo::CategoriaRepo;

pub struct CategoriaService<'a> {
    pub conn: &'a Connection,
}

impl<'a> CategoriaService<'a> {

    pub fn new(conn: &'a Connection) -> Self 
    {
        Self { conn }
    }

    pub fn list_categorias(&self) -> Result<Vec<Categoria>> 
    {
        let repo = CategoriaRepo {conn: self.conn};
        repo.list()
    }

    pub fn get_categoria(&self, id:i64) -> Result<Categoria>
    {
        let repo = CategoriaRepo { conn: self.conn};
        repo.get(id)
    }

    pub fn create_categoria(&self, nombre: &str) -> Result<i64>
    {
        let repo = CategoriaRepo { conn: self.conn};
        repo.create(nombre)
    }

    pub fn update_categoria(&self, categoria: &Categoria) -> Result<()>
    {
        let repo = CategoriaRepo { conn: self.conn};
        repo.update(categoria)
    }

    pub fn delete_categoria(&self, id: i64) -> Result<()>
    {
        let repo = CategoriaRepo { conn: self.conn};
        repo.delete(id)
    }


}