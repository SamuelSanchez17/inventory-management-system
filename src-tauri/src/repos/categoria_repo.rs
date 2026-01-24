use rusqlite::{Connection, params};
use crate::models::Categoria;

pub struct CategoriaRepo<'a> {
    pub conn: &'a Connection,
}

//metodos CRUD

impl<'a> CategoriaRepo<'a> 
{

    pub fn list(&self) -> rusqlite::Result<Vec<Categoria>> 
    {
        let mut stmt = self.conn.prepare("SELECT id_categoria, nombre FROM categorias")?;

        let rows = stmt.query_map([], |row| {
            Ok(Categoria {
                id_categoria: row.get(0)?,
                nombre: row.get(1)?,
            })
        })?;

        let mut categorias = Vec::new();
        for categoria in rows {
            categorias.push(categoria?);
        }
        Ok(categorias)
    }


    //get
    pub fn get(&self, id: i64) -> rusqlite::Result<Categoria> 
    {
        self.conn.query_row(
            "SELECT id_categoria, nombre FROM categorias WHERE id_categoria = ?1", 
            params![id],
        |row| {
                Ok(Categoria {
                    id_categoria:row.get(0)?,
                    nombre: row.get(1)?,
                })
            }, 
        )   
    }


    //create
    pub fn create(&self, nombre: &str) -> rusqlite::Result<i64> 
    {
        self.conn.execute("INSERT INTO categorias (nombre) VALUES (?1)", params![nombre], )?;
        Ok(self.conn.last_insert_rowid())
    }

    //update
    pub fn update(&self, categoria: &Categoria) -> rusqlite::Result<()> 
    {
        self.conn.execute("UPDATE categorias SET nombre = ?1 WHERE id_categoria = ?2", params![categoria.nombre, categoria.id_categoria], )?;
        Ok(())
    }

    //delete
    pub fn delete(&self, id: i64) -> rusqlite::Result<()>
    {
        self.conn.execute("DELETE FROM categorias WHERE id_categoria = ?1", params![id] )?;
        Ok(())
    }

}

