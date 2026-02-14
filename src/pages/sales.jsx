import { useContext, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { invoke, isTauri, convertFileSrc } from '@tauri-apps/api/core';
import { Search, Plus, Minus, Trash2, ShoppingCart } from 'lucide-react';
import Sidebar from '../components/sidebar';
import { ThemeContext } from '../context/ThemeContext';
import '../styles/sales.css';

const paymentOptions = [
  { value: 'Abono', label: 'Abono' },
  { value: 'Contado', label: 'De Contado' },
];

export default function Sales({ onNavigate, currentPage, isSidebarCollapsed, toggleSidebar }) {
  const { getActiveTheme } = useContext(ThemeContext);
  const isDark = getActiveTheme() === 'oscuro';
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cartItems, setCartItems] = useState([]);
  const [clienteName, setClienteName] = useState('');
  const [saleDate, setSaleDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [tipoPago, setTipoPago] = useState('Contado');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const maxDate = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const loadProducts = async () => {
      if (!isTauri()) {
        return;
      }

      try {
        const data = await invoke('list_productos');
        setProducts(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error al cargar productos:', error);
        toast.error('No se pudieron cargar los productos');
      }
    };

    loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return products;
    return products.filter((product) => {
      const nameMatch = product.nombre_producto?.toLowerCase().includes(term);
      const idMatch = String(product.id_producto ?? '').includes(term);
      return nameMatch || idMatch;
    });
  }, [products, searchTerm]);

  const subtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.cantidad * item.precio_unitario, 0),
    [cartItems]
  );

  const handleAddToCart = (product) => {
    if (Number(product.stock) <= 0) {
      toast.error('Producto sin stock');
      return;
    }

    setCartItems((prev) => {
      const existing = prev.find((item) => item.id_producto === product.id_producto);
      if (existing) {
        return prev.map((item) => {
          if (item.id_producto !== product.id_producto) return item;
          const nextQty = Math.min(Number(product.stock), item.cantidad + 1);
          return { ...item, cantidad: nextQty };
        });
      }
      return [
        ...prev,
        {
          id_producto: product.id_producto,
          nombre_producto: product.nombre_producto,
          cantidad: 1,
          stock: Number(product.stock),
          precio_unitario: Number(product.precio),
          miniatura_base64: product.miniatura_base64,
          ruta_imagen: product.ruta_imagen,
        },
      ];
    });
  };

  const handleUpdateQuantity = (idProducto, nextValue) => {
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.id_producto !== idProducto) return item;
        const clamped = Math.max(1, Math.min(item.stock || 1, nextValue));
        return { ...item, cantidad: clamped };
      })
    );
  };

  const handleRemoveItem = (idProducto) => {
    setCartItems((prev) => prev.filter((item) => item.id_producto !== idProducto));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const handleSearchNow = () => {
    setSearchTerm((prev) => prev.trim());
  };

  const handleSubmitSale = async () => {
    if (!clienteName.trim()) {
      toast.error('Ingresa el nombre de la clienta');
      return;
    }

    if (cartItems.length === 0) {
      toast.error('Agrega al menos un producto');
      return;
    }

    if (!isTauri()) {
      toast.error('Backend Tauri no disponible. Ejecuta tauri dev.');
      return;
    }

    const input = {
      fecha: new Date(saleDate).toISOString(),
      nombre_clienta: clienteName.trim(),
      tipo_pago: tipoPago,
      productos: cartItems.map((item) => ({
        id_producto: item.id_producto,
        nombre_producto: item.nombre_producto,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
      })),
    };

    try {
      setIsSubmitting(true);
      const result = await invoke('create_venta_completa', { input });
      toast.success(`Venta registrada (#${result.id_venta})`);
      setCartItems([]);
      setClienteName('');
      setSaleDate(() => {
        const today = new Date();
        return today.toISOString().split('T')[0];
      });
      setTipoPago('Contado');
    } catch (error) {
      console.error('Error al registrar venta:', error);
      toast.error('No se pudo registrar la venta');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen flex ${isDark ? 'bg-gray-900' : 'bg-rose-50'}`}>
      <Sidebar
        onNavigate={onNavigate}
        activePage={currentPage}
        isCollapsed={isSidebarCollapsed}
        toggleSidebar={toggleSidebar}
      />

      <main className={`sales-page ${isDark ? 'sales-dark' : ''}`}>
        <header className="sales-header">
          <div>
            <h1>Registrar Venta</h1>
            <span className="sales-subtitle">Busca productos, ajusta cantidades y confirma el pago.</span>
          </div>
          <div className="sales-header-meta">
            <div className="sales-chip">
              <ShoppingCart size={16} />
              <span>{cartItems.length} items</span>
            </div>
          </div>
        </header>

        <section className="sales-layout">
          <div className="sales-panel">
            <div className="sales-search">
              <label htmlFor="sales-search-input">Buscar</label>
              <div className="sales-search-bar">
                <Search size={18} />
                <input
                  id="sales-search-input"
                  type="text"
                  placeholder="Buscar por nombre de producto"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      handleSearchNow();
                    }
                  }}
                />
                <button type="button" className="sales-search-btn" aria-label="Buscar producto" onClick={handleSearchNow}>
                  <Search size={18} />
                </button>
              </div>
            </div>

            <div className="sales-catalog">
              <div className="sales-catalog-head">
                <span>Productos disponibles</span>
                <span className="sales-catalog-count">{filteredProducts.length} resultados</span>
              </div>
              <div className="sales-catalog-grid">
                {filteredProducts.map((product) => {
                  const imageSrc = product.miniatura_base64
                    ? `data:image/jpeg;base64,${product.miniatura_base64}`
                    : product.ruta_imagen
                    ? convertFileSrc(product.ruta_imagen)
                    : null;
                  return (
                    <button
                      type="button"
                      key={product.id_producto}
                      className="sales-product-card"
                      onClick={() => handleAddToCart(product)}
                      disabled={Number(product.stock) <= 0}
                    >
                      <div className="sales-product-image">
                        {imageSrc ? <img src={imageSrc} alt="" /> : <span>🧾</span>}
                      </div>
                      <div className="sales-product-info">
                        <div>
                          <h3>{product.nombre_producto}</h3>
                          <p>Codigo #{product.id_producto}</p>
                        </div>
                        <div className="sales-product-meta">
                          <span className="sales-price">${Number(product.precio).toFixed(2)}</span>
                          <span className={`sales-stock ${Number(product.stock) <= 3 ? 'low' : ''}`}>
                            Stock: {product.stock}
                          </span>
                        </div>
                      </div>
                      <span className="sales-add">Agregar</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <aside className="sales-cart">
            <div className="sales-cart-card">
              <div className="sales-cart-head">
                <h2>Carrito</h2>
                <button type="button" className="sales-clear" onClick={handleClearCart}>
                  Limpiar
                </button>
              </div>

              {cartItems.length === 0 ? (
                <div className="sales-empty">
                  <div className="sales-empty-icon">🧺</div>
                  <p>Agrega productos para iniciar la venta.</p>
                </div>
              ) : (
                <ul className="sales-cart-list">
                  {cartItems.map((item) => (
                    <li key={item.id_producto} className="sales-cart-item">
                      <div className="sales-cart-info">
                        <div>
                          <h4>{item.nombre_producto}</h4>
                          <span>${item.precio_unitario.toFixed(2)} x {item.cantidad}</span>
                        </div>
                        <div className="sales-cart-actions">
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(item.id_producto, item.cantidad - 1)}
                            disabled={item.cantidad <= 1}
                          >
                            <Minus size={14} />
                          </button>
                          <span>{item.cantidad}</span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(item.id_producto, item.cantidad + 1)}
                            disabled={item.cantidad >= item.stock}
                          >
                            <Plus size={14} />
                          </button>
                          <button type="button" className="danger" onClick={() => handleRemoveItem(item.id_producto)}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      <div className="sales-cart-total">${(item.cantidad * item.precio_unitario).toFixed(2)}</div>
                    </li>
                  ))}
                </ul>
              )}

              <div className="sales-summary">
                <div>
                  <span>Subtotal</span>
                  <strong>${subtotal.toFixed(2)}</strong>
                </div>
                <div>
                  <span>Total</span>
                  <strong className="total">${subtotal.toFixed(2)}</strong>
                </div>
              </div>
            </div>

            <div className="sales-checkout">
              <h3>Datos de la venta</h3>
              <label>
                Nombre de la clienta
                <input
                  type="text"
                  placeholder="Ej. Maria Lopez"
                  value={clienteName}
                  onChange={(event) => setClienteName(event.target.value)}
                />
              </label>
              <label>
                Fecha de la venta
                <input
                  type="date"
                  value={saleDate}
                  max={maxDate}
                  onChange={(event) => setSaleDate(event.target.value)}
                />
              </label>
              <label>
                Tipo de pago
                <select value={tipoPago} onChange={(event) => setTipoPago(event.target.value)}>
                  {paymentOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                className="sales-pay"
                onClick={handleSubmitSale}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Registrando...' : 'Pagar'}
              </button>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}
