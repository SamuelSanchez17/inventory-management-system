export default function ReportsItemsModal({
  open,
  t,
  onClose,
  editItems,
  productsById,
  products,
  usedProductIds,
  onItemProductChange,
  onItemQtyChange,
  formatMoney,
  onRemoveItem,
  onAddItem,
  onSaveItems,
  isSavingItems,
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="reports-modal-overlay" onClick={onClose}>
      <div className="reports-modal reports-modal-wide" onClick={(event) => event.stopPropagation()}>
        <div className="reports-modal-header">
          <h3>{t('reports_items_title')}</h3>
          <p>{t('reports_items_desc')}</p>
        </div>
        <div className="reports-items-list">
          {editItems.length === 0 ? (
            <p className="reports-modal-text">{t('reports_items_empty')}</p>
          ) : (
            editItems.map((item, index) => (
              <div
                key={item.id_producto_vendido ?? item.temp_id ?? index}
                className="reports-items-row"
              >
                <select
                  value={item.id_producto ?? ''}
                  onChange={(event) => onItemProductChange(index, event.target.value)}
                >
                  {!productsById.has(item.id_producto) && item.id_producto && (
                    <option value={item.id_producto}>
                      {item.nombre_producto_snapshot || `ID ${item.id_producto}`}
                    </option>
                  )}
                  {products
                    .filter((p) => p.id_producto === item.id_producto || !usedProductIds.has(p.id_producto))
                    .map((product) => (
                      <option key={product.id_producto} value={product.id_producto}>
                        {product.nombre_producto}
                      </option>
                    ))}
                </select>
                <select
                  value={item.cantidad}
                  onChange={(event) => onItemQtyChange(index, event.target.value)}
                >
                  {(() => {
                    const prod = productsById.get(item.id_producto);
                    const currentStock = prod?.stock ?? 0;
                    const sameProduct = item.id_producto === item.original_id_producto;
                    const alreadySold = (item.id_producto_vendido && sameProduct) ? (item.original_cantidad ?? 0) : 0;
                    const maxQty = Math.max(1, currentStock + alreadySold);
                    return Array.from({ length: maxQty }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ));
                  })()}
                </select>
                <div className="reports-items-price">{formatMoney(item.precio_unitario)}</div>
                <div className="reports-items-subtotal">{formatMoney(item.subtotal)}</div>
                <button
                  type="button"
                  className="reports-items-remove"
                  onClick={() => onRemoveItem(item)}
                >
                  {t('reports_items_remove')}
                </button>
              </div>
            ))
          )}
        </div>
        <div className="reports-items-footer">
          <button
            type="button"
            className="reports-items-add"
            onClick={onAddItem}
            disabled={products.filter((p) => !usedProductIds.has(p.id_producto)).length === 0}
          >
            + {t('reports_items_add')}
          </button>
          <div className="reports-items-total">
            <span>{t('reports_items_total')}</span>
            <strong>
              {formatMoney(editItems.reduce((sum, item) => sum + Number(item.subtotal || 0), 0))}
            </strong>
          </div>
        </div>
        <div className="reports-modal-actions">
          <button type="button" className="reports-modal-button reports-modal-secondary" onClick={onClose}>
            {t('reports_items_cancel')}
          </button>
          <button
            type="button"
            className="reports-modal-button reports-modal-primary"
            onClick={onSaveItems}
            disabled={isSavingItems}
          >
            {isSavingItems ? '...' : t('reports_items_save')}
          </button>
        </div>
      </div>
    </div>
  );
}
