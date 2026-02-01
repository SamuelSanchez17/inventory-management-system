//clase para las definiciones de los modelos de la base de datos
use serde::{Serialize, Deserialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct Producto 
{
    pub id_producto: i64,
    pub nombre_producto: String,
    pub id_categoria: Option<i64>,
    pub ruta_imagen: Option<String>,
    pub stock: i64,
    pub precio: f64,
    pub creado_at: Option<String>,
    pub actualizado_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Categoria
{
    pub id_categoria: i64,
    pub nombre: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum TipoPago
{

    #[serde(rename = "Abono")]
    Abono,
    #[serde(rename = "Contado")]
    Contado,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Venta
{
    pub id_venta: i64,
    pub fecha: String,
    pub nombre_clienta: String,
    pub total_venta: f64,
    pub tipo_pago: TipoPago,
    
}

/* 
#[derive(Debug, Serialize, Deserialize)]
pub struct ProductoVendido
{
    pub id_producto_vendido: i64,
    pub id_venta: i64,
    pub id_producto: i64,
    pub cantidad: i64,
    pub precio_unitario: f64,
    pub subtotal: f64,
}
*/