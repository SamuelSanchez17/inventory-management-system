PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

-- Categorías
CREATE TABLE categorias (
  id_categoria INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL UNIQUE
);

-- Productos
CREATE TABLE productos (
  id_producto INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre_producto TEXT NOT NULL,
  id_categoria INTEGER REFERENCES categorias(id_categoria) ON DELETE SET NULL,
  ruta_imagen TEXT,
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  precio REAL NOT NULL DEFAULT 0.0,
  creado_at TEXT DEFAULT (datetime('now','localtime')),
  actualizado_at TEXT DEFAULT (datetime('now','localtime'))
);

CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(id_categoria);
CREATE INDEX IF NOT EXISTS idx_productos_stock ON productos(stock);

-- Ventas (cabecera)
CREATE TABLE ventas (
  id_venta INTEGER PRIMARY KEY AUTOINCREMENT,
  fecha TEXT DEFAULT (datetime('now','localtime')),
  total_venta REAL NOT NULL,
  notas TEXT
);

-- Productos vendidos / items de venta
CREATE TABLE productos_vendidos (
  id_producto_vendido INTEGER PRIMARY KEY AUTOINCREMENT,
  id_venta INTEGER NOT NULL REFERENCES ventas(id_venta) ON DELETE CASCADE,
  id_producto INTEGER NOT NULL REFERENCES productos(id_producto),
  cantidad INTEGER NOT NULL CHECK (cantidad > 0),
  precio_unitario REAL NOT NULL CHECK (precio_unitario >= 0),
  subtotal REAL NOT NULL,
  CONSTRAINT fk_venta_producto UNIQUE(id_venta, id_producto)
);

CREATE INDEX IF NOT EXISTS idx_prodvend_venta ON productos_vendidos(id_venta);
CREATE INDEX IF NOT EXISTS idx_prodvend_producto ON productos_vendidos(id_producto);

-- Triggers para mantener el stock automáticamente
-- Reducir stock al insertar un item de venta
CREATE TRIGGER IF NOT EXISTS trg_prodvend_after_insert
AFTER INSERT ON productos_vendidos
BEGIN
  UPDATE productos
  SET stock = stock - NEW.cantidad,
      actualizado_at = datetime('now','localtime')
  WHERE id_producto = NEW.id_producto;
END;

-- Restaurar stock al eliminar un item de venta
CREATE TRIGGER IF NOT EXISTS trg_prodvend_after_delete
AFTER DELETE ON productos_vendidos
BEGIN
  UPDATE productos
  SET stock = stock + OLD.cantidad,
      actualizado_at = datetime('now','localtime')
  WHERE id_producto = OLD.id_producto;
END;

-- Ajustar stock si se actualiza la cantidad (restar diferencia)
CREATE TRIGGER IF NOT EXISTS trg_prodvend_after_update
AFTER UPDATE OF cantidad ON productos_vendidos
BEGIN
  -- Si cantidad cambia, restar la diferencia: NEW.cantidad - OLD.cantidad
  UPDATE productos
  SET stock = stock - (NEW.cantidad - OLD.cantidad),
      actualizado_at = datetime('now','localtime')
  WHERE id_producto = NEW.id_producto;
END;