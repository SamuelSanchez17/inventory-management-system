export default function EditProductModal({
  open,
  product,
  formData,
  onFormChange,
  onImageChange,
  onSave,
  onCancel,
  categories,
  t,
  isDark,
  editImagePreview,
}) {
  if (!open || !product) return null;

  return (
    <div className="products-modal-overlay" role="dialog" aria-modal="true">
      <div className={`products-modal ${isDark ? 'products-modal-dark' : ''}`}>
        <div className="products-modal-header">
          <h3>{t('dashboard_edit_title')}</h3>
          <p>{product.nombre_producto}</p>
        </div>

        <div className="products-modal-body">
          <div className="products-modal-image-field">
            <div className="products-modal-image-preview">
              {editImagePreview ? (
                <img src={editImagePreview} alt="Vista previa" />
              ) : (
                <div className="products-modal-image-placeholder">{t('dashboard_edit_no_image')}</div>
              )}
            </div>
            <label className="products-modal-image-upload">
              <input type="file" accept="image/*" onChange={onImageChange} />
              {editImagePreview ? t('dashboard_edit_change_image') : t('dashboard_edit_add_image')}
            </label>
          </div>

          <label className="products-modal-field">
            <span>{t('dashboard_edit_name')}</span>
            <input name="nombre_producto" value={formData.nombre_producto}
              onChange={onFormChange} type="text" />
          </label>

          <label className="products-modal-field">
            <span>{t('dashboard_edit_category')}</span>
            <select name="id_categoria" value={formData.id_categoria} onChange={onFormChange}>
              <option value="">{t('dashboard_edit_no_category')}</option>
              {categories.map((cat) => (
                <option key={cat.id_categoria} value={cat.id_categoria}>{cat.nombre}</option>
              ))}
            </select>
          </label>

          <label className="products-modal-field">
            <span>{t('dashboard_edit_stock')}</span>
            <input name="stock" value={formData.stock} onChange={onFormChange} type="number" min="0" />
          </label>

          <label className="products-modal-field">
            <span>{t('products_price_consultora_label')}</span>
            <input name="precio_consultora" value={formData.precio_consultora}
              onChange={onFormChange} type="number" min="0" step="0.01" />
          </label>

          <label className="products-modal-field">
            <span>{t('products_price_publico_label')}</span>
            <input name="precio_publico" value={formData.precio_publico}
              onChange={onFormChange} type="number" min="0" step="0.01" />
          </label>
        </div>

        <div className="products-modal-actions">
          <button type="button" className="products-modal-button products-modal-secondary" onClick={onCancel}>
            {t('dashboard_edit_cancel')}
          </button>
          <button type="button" className="products-modal-button products-modal-primary" onClick={onSave}>
            {t('dashboard_edit_save')}
          </button>
        </div>
      </div>
    </div>
  );
}
