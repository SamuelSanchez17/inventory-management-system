//clase para las definiciones de los modelos de la base de datos
use serde::{Serialize, Deserialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct Producto 
{
    pub id_producto: i64,
    pub nombre_producto: String,
    pub id_categoria: Option<i64>,
    pub ruta_imagen: Option<String>,
    pub miniatura_base64: Option<String>,
    pub stock: i64,
    pub precio: f64,
    pub creado_at: Option<String>,
    pub actualizado_at: Option<String>,
    #[serde(default = "default_activo")]
    pub activo: i64,
}

fn default_activo() -> i64 {
    1
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

 
#[derive(Debug, Serialize, Deserialize)]
pub struct ProductoVendido
{
    pub id_producto_vendido: i64,
    pub id_venta: i64,
    pub id_producto: i64,
    pub nombre_producto_snapshot: String,
    pub cantidad: i64,
    pub precio_unitario: f64,
    pub subtotal: f64,
}

// Estructuras para el comando de venta completa
#[derive(Debug, Serialize, Deserialize)]
pub struct ItemVenta
{
    pub id_producto: i64,
    pub nombre_producto: String,
    pub cantidad: i64,
    pub precio_unitario: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct VentaCompletaInput
{
    pub fecha: String,
    pub nombre_clienta: String,
    pub tipo_pago: TipoPago,
    pub productos: Vec<ItemVenta>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct VentaCompletaOutput
{
    pub id_venta: i64,
    pub total_venta: f64,
    pub items_insertados: usize,
}

// Top productos más vendidos (para dashboard)
#[derive(Debug, Serialize, Deserialize)]
pub struct TopProducto
{
    pub nombre: String,
    pub unidades: i64,
    pub ingreso: f64,
}
