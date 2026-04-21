import { Minus, Plus, ShoppingCartSimple, Trash } from 'phosphor-react';

export default function SalesCartPanel({
  t,
  cartItems,
  subtotal,
  onClearCart,
  onUpdateQuantity,
  onRemoveItem,
}) {
  return (
    <div className="sales-cart-card">
      <div className="sales-cart-head">
        <h2>{t('sales_cart')}</h2>
        <button type="button" className="sales-clear" onClick={onClearCart}>
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
                    onClick={() => onUpdateQuantity(item.id_producto, item.cantidad - 1)}
                    disabled={item.cantidad <= 1}
                  >
                    <Minus size={14} weight="duotone" />
                  </button>
                  <span>{item.cantidad}</span>
                  <button
                    type="button"
                    onClick={() => onUpdateQuantity(item.id_producto, item.cantidad + 1)}
                    disabled={item.cantidad >= item.stock}
                  >
                    <Plus size={14} weight="duotone" />
                  </button>
                  <button type="button" className="danger" onClick={() => onRemoveItem(item.id_producto)}>
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
  );
}
