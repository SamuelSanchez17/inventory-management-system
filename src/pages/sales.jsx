import { useContext, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { invoke, isTauri } from '@tauri-apps/api/core';
import { ShoppingCart } from 'phosphor-react';
import { ThemeContext } from '../context/ThemeContext';
import { LanguageContext } from '../context/LanguageContext';
import SalesCatalogPanel from '../components/sales/SalesCatalogPanel';
import SalesCartPanel from '../components/sales/SalesCartPanel';
import SalesCheckoutPanel from '../components/sales/SalesCheckoutPanel';
import { fuzzyFilterByName } from '../utils/fuzzySearch';
import { formatCurrency, getPublicPrice, normalizeMoney } from '../utils/pricing';
import '../styles/sales.css';

export default function Sales() {
  const { getActiveTheme } = useContext(ThemeContext);
  const { t } = useContext(LanguageContext);
  const isDark = getActiveTheme() === 'oscuro';
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cartItems, setCartItems] = useState([]);
  const [clienteName, setClienteName] = useState('');
  const [clienteLastName, setClienteLastName] = useState('');
  const [saleDate, setSaleDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [tipoPago, setTipoPago] = useState('Contado');
  const [abonoInicial, setAbonoInicial] = useState('');
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

  const filteredProducts = useMemo(() => {
    return fuzzyFilterByName(products, searchTerm, (product) => product.nombre_producto);
  }, [products, searchTerm]);

  const subtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.cantidad * item.precio_unitario, 0),
    [cartItems]
  );

  const isAbonoPayment = tipoPago === 'Abono';

  const abonoInicialAmount = useMemo(() => {
    if (!abonoInicial.trim()) return 0;
    const parsed = Number(abonoInicial);
    return Number.isFinite(parsed) ? normalizeMoney(parsed) : NaN;
  }, [abonoInicial]);

  const saldoProyectado = useMemo(() => {
    if (!Number.isFinite(abonoInicialAmount)) return normalizeMoney(subtotal);
    const clamped = Math.min(normalizeMoney(subtotal), Math.max(0, abonoInicialAmount));
    return normalizeMoney(Math.max(0, normalizeMoney(subtotal) - clamped));
  }, [subtotal, abonoInicialAmount]);

  const handleAddToCart = (product) => {
    if (Number(product.stock) <= 0) {
      toast.error(t('sales_no_stock'));
      return;
    }

    const precioPublico = getPublicPrice(product);

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
          precio_unitario: precioPublico,
          precio_publico: precioPublico,
          precio_consultora: Number(product.precio_consultora ?? 0),
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

    if (!clienteLastName.trim()) {
      toast.error(t('toast_client_lastname_required'));
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

    if (isAbonoPayment && abonoInicial.trim()) {
      if (!Number.isFinite(abonoInicialAmount) || abonoInicialAmount < 0) {
        toast.error(t('toast_abono_invalid_amount'));
        return;
      }
      if (abonoInicialAmount > normalizeMoney(subtotal)) {
        toast.error(t('toast_abono_initial_exceeds_total'));
        return;
      }
    }

    const input = {
      fecha: new Date(saleDate).toISOString(),
      nombre_clienta: clienteName.trim(),
      apellido_clienta: clienteLastName.trim(),
      tipo_pago: tipoPago,
      productos: cartItems.map((item) => ({
        id_producto: item.id_producto,
        nombre_producto: item.nombre_producto,
        cantidad: item.cantidad,
        precio_unitario: item.precio_publico,
      })),
    };

    try {
      setIsSubmitting(true);
      const abonoInicialPayload = isAbonoPayment && abonoInicial.trim()
        ? normalizeMoney(abonoInicialAmount)
        : null;

      const result = await invoke('create_venta_completa', { input, abonoInicial: abonoInicialPayload });
      toast.success(`${t('toast_sale_registered')} (#${result.id_venta})`);

      setCartItems([]);
      setClienteName('');
      setClienteLastName('');
      setSaleDate(() => {
        const today = new Date();
        return today.toISOString().split('T')[0];
      });
      setTipoPago('Contado');
      setAbonoInicial('');
    } catch (error) {
      console.error('Error al registrar venta:', error);
      toast.error(t('toast_sale_error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
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
          <SalesCatalogPanel
            t={t}
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            onSearchNow={handleSearchNow}
            filteredProducts={filteredProducts}
            onAddToCart={handleAddToCart}
            getPublicPrice={getPublicPrice}
          />

          <aside className="sales-cart">
            <SalesCartPanel
              t={t}
              cartItems={cartItems}
              subtotal={subtotal}
              onClearCart={handleClearCart}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
            />

            <SalesCheckoutPanel
              t={t}
              clienteName={clienteName}
              onClienteNameChange={setClienteName}
              clienteLastName={clienteLastName}
              onClienteLastNameChange={setClienteLastName}
              saleDate={saleDate}
              maxDate={maxDate}
              onSaleDateChange={setSaleDate}
              tipoPago={tipoPago}
              onTipoPagoChange={setTipoPago}
              isAbonoPayment={isAbonoPayment}
              abonoInicial={abonoInicial}
              onAbonoInicialChange={setAbonoInicial}
              subtotal={subtotal}
              abonoInicialAmount={abonoInicialAmount}
              saldoProyectado={saldoProyectado}
              formatCurrency={formatCurrency}
              onSubmitSale={handleSubmitSale}
              isSubmitting={isSubmitting}
            />
          </aside>
        </section>
    </main>
  );
}
