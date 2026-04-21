import { Image as ImageIcon } from 'phosphor-react';

export default function CreateProductModal({
  open,
  onClose,
  formData,
  onInputChange,
  onImageUpload,
  onSubmit,
  categories,
  t,
  isDark,
}) {
  if (!open) return null;

  return (
    <div className="products-modal-overlay" onClick={onClose}>
      <div className={`products-modal ${isDark ? 'products-modal-dark' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="products-modal-header">
          <h3>{t('products_register_title')}</h3>
        </div>

        <form onSubmit={onSubmit} className="products-modal-body">
          {/* Image */}
          <div className="products-modal-image-field">
            <div className="products-modal-image-preview">
              {formData.ruta_imagen ? (
                <img src={formData.ruta_imagen} alt="Producto" />
              ) : (
                <div className="products-modal-image-placeholder">
                  <ImageIcon size={36} weight="duotone" />
                  <span>{t('products_image_load')}</span>
                </div>
              )}
            </div>
            <label className="products-modal-image-upload">
              <input type="file" accept="image/*" onChange={onImageUpload} />
              {formData.ruta_imagen ? t('products_image_change') : t('products_image_upload')}
            </label>
          </div>

          {/* Name */}
          <label className="products-modal-field">
            <span>{t('products_name_label')}</span>
            <input type="text" name="nombre_producto" value={formData.nombre_producto}
              onChange={onInputChange} placeholder={t('products_name_placeholder')} required />
          </label>

          {/* Category */}
          <label className="products-modal-field">
            <span>{t('products_category_label')}</span>
            <select name="id_categoria" value={formData.id_categoria} onChange={onInputChange} required>
              <option value="">{t('products_select_category')}</option>
              {categories.map((cat) => (
                <option key={cat.id_categoria} value={cat.id_categoria}>{cat.nombre}</option>
              ))}
            </select>
          </label>

          {/* Stock & Prices */}
          <div className="products-modal-row">
            <label className="products-modal-field">
              <span>{t('products_stock_label')}</span>
              <input type="number" name="stock" value={formData.stock}
                onChange={onInputChange} placeholder={t('products_stock_placeholder')} min="0" required />
            </label>
            <label className="products-modal-field">
              <span>{t('products_price_consultora_label')}</span>
              <input type="number" name="precio_consultora" value={formData.precio_consultora}
                onChange={onInputChange} placeholder={t('products_price_consultora_placeholder')} step="0.01" min="0" required />
            </label>
          </div>

          <div className="products-modal-row">
            <label className="products-modal-field">
              <span>{t('products_price_publico_label')}</span>
              <input type="number" name="precio_publico" value={formData.precio_publico}
                onChange={onInputChange} placeholder={t('products_price_publico_placeholder')} step="0.01" min="0" required />
            </label>
          </div>

          <div className="products-modal-actions">
            <button type="button" className="products-modal-button products-modal-secondary" onClick={onClose}>
              {t('dashboard_edit_cancel')}
            </button>
            <button type="submit" className="products-modal-button products-modal-primary">
              {t('products_btn_save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
