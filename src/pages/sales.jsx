import { useContext, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { invoke, isTauri, convertFileSrc } from '@tauri-apps/api/core';
import {
  MagnifyingGlass,
  Minus,
  Plus,
  Receipt,
  ShoppingCart,
  ShoppingCartSimple,
  Trash,
} from 'phosphor-react';
import Sidebar from '../components/sidebar';
import { ThemeContext } from '../context/ThemeContext';
import { LanguageContext } from '../context/LanguageContext';
import '../styles/sales.css';

export default function Sales({ onNavigate, currentPage, isSidebarCollapsed, toggleSidebar }) {
  const { getActiveTheme } = useContext(ThemeContext);
  const { t } = useContext(LanguageContext);
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
        toast.error(t('toast_products_load_error'));
      }
    };

    loadProducts();
  }, []);

  // Función para convertir palabras al singular
  const toSingular = (word) => {
    if (word.length <= 3) {
      return word;
    }

    if (word.endsWith('ces')) {
      return `${word.slice(0, -3)}z`;
    }

    if (word.endsWith('es')) {
      return word.slice(0, -2);
    }

    if (word.endsWith('s')) {
      return word.slice(0, -1);
    }

    return word;
  };

  // Función para normalizar texto (elimina diacríticos, caracteres especiales, comillas)
  const normalizeText = (text) => {
    if (!text) {
      return '';
    }

    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .map(toSingular)
      .join(' ');
  };

  // Algoritmo de Levenshtein para búsqueda difusa
  const levenshteinDistance = (source, target) => {
    if (source === target) {
      return 0;
    }

    if (!source) {
      return target.length;
    }

    if (!target) {
      return source.length;
    }

    const sourceLength = source.length;
    const targetLength = target.length;
    let prev = Array.from({ length: targetLength + 1 }, (_, idx) => idx);

    for (let i = 1; i <= sourceLength; i += 1) {
      const current = [i];
      for (let j = 1; j <= targetLength; j += 1) {
        const cost = source[i - 1] === target[j - 1] ? 0 : 1;
        current[j] = Math.min(
          prev[j] + 1,
          current[j - 1] + 1,
          prev[j - 1] + cost
        );
      }
      prev = current;
    }

    return prev[targetLength];
  };

  const normalizedQuery = useMemo(() => normalizeText(searchTerm), [searchTerm]);

  const filteredProducts = useMemo(() => {
    if (!normalizedQuery) {
      return products;
    }

    const scored = products.map((product) => {
      const name = normalizeText(product.nombre_producto || '');
      const distance = name.includes(normalizedQuery)
        ? 0
        : levenshteinDistance(normalizedQuery, name);
      return { product, name, distance };
    });

    const threshold = Math.max(1, Math.floor(normalizedQuery.length * 0.4));
    const matches = scored.filter(
      (item) => item.name.includes(normalizedQuery) || item.distance <= threshold
    );

    const sorted = (matches.length ? matches : scored)
      .slice()
      .sort((a, b) => {
        if (a.distance !== b.distance) {
          return a.distance - b.distance;
        }
        return (a.product.nombre_producto || '').localeCompare(
          b.product.nombre_producto || ''
        );
      });

    const finalResults = matches.length ? sorted : sorted.slice(0, 3);
    return finalResults.map((item) => item.product);
  }, [products, normalizedQuery]);

  const subtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.cantidad * item.precio_unitario, 0),
    [cartItems]
  );

  const handleAddToCart = (product) => {
    if (Number(product.stock) <= 0) {
      toast.error(t('sales_no_stock'));
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
      toast.error(t('toast_client_required'));
      return;
    }

    if (cartItems.length === 0) {
      toast.error(t('toast_cart_empty'));
      return;
    }

    const selectedDate = new Date(saleDate).toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    if (selectedDate > today) {
      toast.error(t('toast_future_date_error'));
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
      toast.success(`${t('toast_sale_registered')} (#${result.id_venta})`);
      setCartItems([]);
      setClienteName('');
      setSaleDate(() => {
        const today = new Date();
        return today.toISOString().split('T')[0];
      });
      setTipoPago('Contado');
    } catch (error) {
      console.error('Error al registrar venta:', error);
      toast.error(t('toast_sale_error'));
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
            <h1>{t('sales_title')}</h1>
            <span className="sales-subtitle">{t('sales_subtitle')}</span>
          </div>
          <div className="sales-header-meta">
            <div className="sales-chip">
              <ShoppingCart size={16} weight="duotone" />
              <span>{cartItems.length} {t('sales_items')}</span>
            </div>
          </div>
        </header>

        <section className="sales-layout">
          <div className="sales-panel">
            <div className="sales-search">
              <label htmlFor="sales-search-input">{t('sales_search_label')}</label>
              <div className="sales-search-bar">
                <MagnifyingGlass size={18} weight="duotone" />
                <input
                  id="sales-search-input"
                  type="text"
                  placeholder={t('sales_search_placeholder')}
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      handleSearchNow();
                    }
                  }}
                />
                <button type="button" className="sales-search-btn" aria-label="Buscar producto" onClick={handleSearchNow}>
                  <MagnifyingGlass size={18} weight="duotone" />
                </button>
              </div>
            </div>

            <div className="sales-catalog">
              <div className="sales-catalog-head">
                <span>{t('sales_available')}</span>
                <span className="sales-catalog-count">{filteredProducts.length} {t('sales_results')}</span>
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
                        {imageSrc ? <img src={imageSrc} alt="" /> : <Receipt size={20} weight="duotone" />}
                      </div>
                      <div className="sales-product-info">
                        <div>
                          <h3>{product.nombre_producto}</h3>
                          <p>{t('sales_code')} #{product.id_producto}</p>
                        </div>
                        <div className="sales-product-meta">
                          <span className="sales-price">${Number(product.precio).toFixed(2)}</span>
                          <span className={`sales-stock ${Number(product.stock) <= 3 ? 'low' : ''}`}>
                            {t('sales_stock')}: {product.stock}
                          </span>
                        </div>
                      </div>
                      <span className="sales-add">{t('sales_add')}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <aside className="sales-cart">
            <div className="sales-cart-card">
              <div className="sales-cart-head">
                <h2>{t('sales_cart')}</h2>
                <button type="button" className="sales-clear" onClick={handleClearCart}>
                  {t('sales_clear')}
                </button>
              </div>

              {cartItems.length === 0 ? (
                <div className="sales-empty">
                  <div className="sales-empty-icon">
                    <ShoppingCartSimple size={28} weight="duotone" />
                  </div>
                  <p>{t('sales_empty_cart')}</p>
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
                            <Minus size={14} weight="duotone" />
                          </button>
                          <span>{item.cantidad}</span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(item.id_producto, item.cantidad + 1)}
                            disabled={item.cantidad >= item.stock}
                          >
                            <Plus size={14} weight="duotone" />
                          </button>
                          <button type="button" className="danger" onClick={() => handleRemoveItem(item.id_producto)}>
                            <Trash size={14} weight="duotone" />
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
                  <span>{t('sales_subtotal')}</span>
                  <strong>${subtotal.toFixed(2)}</strong>
                </div>
                <div>
                  <span>{t('sales_total')}</span>
                  <strong className="total">${subtotal.toFixed(2)}</strong>
                </div>
              </div>
            </div>

            <div className="sales-checkout">
              <h3>{t('sales_checkout_title')}</h3>
              <label>
                {t('sales_client_label')}
                <input
                  type="text"
                  placeholder={t('sales_client_placeholder')}
                  value={clienteName}
                  onChange={(event) => setClienteName(event.target.value)}
                />
              </label>
              <label>
                {t('sales_date_label')}
                <input
                  type="date"
                  value={saleDate}
                  max={maxDate}
                  inputMode="none"
                  onChange={(event) => setSaleDate(event.target.value)}
                />
              </label>
              <label>
                {t('sales_payment_label')}
                <select value={tipoPago} onChange={(event) => setTipoPago(event.target.value)}>
                  {[
                    { value: 'Abono', label: t('sales_payment_abono') },
                    { value: 'Contado', label: t('sales_payment_contado') },
                  ].map((option) => (
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
                {isSubmitting ? t('sales_btn_paying') : t('sales_btn_pay')}
              </button>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}
