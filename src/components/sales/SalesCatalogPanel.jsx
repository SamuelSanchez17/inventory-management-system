import { convertFileSrc } from '@tauri-apps/api/core';
import { MagnifyingGlass, Receipt } from 'phosphor-react';

export default function SalesCatalogPanel({
  t,
  searchTerm,
  onSearchTermChange,
  onSearchNow,
  filteredProducts,
  onAddToCart,
  getPublicPrice,
}) {
  return (
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
            onChange={(event) => onSearchTermChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                onSearchNow();
              }
            }}
          />
          <button type="button" className="sales-search-btn" aria-label="Buscar producto" onClick={onSearchNow}>
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
            const precioPublico = getPublicPrice(product);
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
                onClick={() => onAddToCart(product)}
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
                    <span className="sales-price">${precioPublico.toFixed(2)}</span>
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
  );
}
