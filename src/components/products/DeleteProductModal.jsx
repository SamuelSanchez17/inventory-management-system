export default function DeleteProductModal({
  open,
  product,
  onConfirm,
  onCancel,
  t,
  isDark,
}) {
  if (!open || !product) return null;

  return (
    <div className="products-modal-overlay" role="dialog" aria-modal="true">
      <div className={`products-modal products-modal-compact ${isDark ? 'products-modal-dark' : ''}`}>
        <div className="products-modal-header">
          <h3>{t('dashboard_delete_title')}</h3>
          <p>{t('dashboard_delete_warning')}</p>
        </div>
        <div className="products-modal-body">
          <p className="products-modal-text">
            {t('dashboard_delete_confirm')} <strong>{product.nombre_producto}</strong>?
          </p>
        </div>
        <div className="products-modal-actions">
          <button type="button" className="products-modal-button products-modal-secondary" onClick={onCancel}>
            {t('dashboard_delete_cancel')}
          </button>
          <button type="button" className="products-modal-button products-modal-danger" onClick={onConfirm}>
            {t('dashboard_delete_btn')}
          </button>
        </div>
      </div>
    </div>
  );
}
