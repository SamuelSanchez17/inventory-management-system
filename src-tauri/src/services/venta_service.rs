use rusqlite::{Connection, Result};
use crate::models::Venta;
use crate::repos::venta_repo::VentaRepo;

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

    pub fn create_venta(&self, fecha: &str, total_venta: f64, notas: Option<&str>) -> Result<i64> 
    {
        let repo = VentaRepo { conn: self.conn};
        repo.create(fecha, total_venta, notas)
    }

    pub fn update_venta(&self, venta: &Venta) -> Result<()> 
    {
        let repo = VentaRepo { conn: self.conn};
        repo.update(venta)
    }

    pub fn delete_venta(&self, id: i64) -> Result<()> 
    {
        let repo = VentaRepo { conn: self.conn};
        repo.delete(id)
    }

}