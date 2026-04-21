export default function SaleRow({
  venta,
  saleProducts,
  isExpanded,
  onToggle,
  onEditSale,
  onDeleteSale,
  onEditItems,
  formatDate,
  formatMoney,
  t,
}) {
  const saleId = venta.id_venta;
  const totalQty = saleProducts.reduce((sum, p) => sum + p.cantidad, 0);
  const clientFullName = `${venta.nombre_clienta || ''} ${venta.apellido_clienta || ''}`.trim();
  const isAbono = venta.tipo_pago === 'Abono';
  const totalAbonado = isAbono ? Number(venta.total_abonado || 0) : Number(venta.total_venta || 0);
  const saldoPendiente = isAbono ? Math.max(0, Number(venta.saldo_pendiente || 0)) : 0;
  const estadoPago = isAbono ? (venta.estado_pago || (saldoPendiente <= 0 ? 'Liquidada' : 'Pendiente')) : 'Liquidada';
  const estadoClass =
    estadoPago === 'Liquidada'
      ? 'estado-liquidada'
      : estadoPago === 'Parcial'
        ? 'estado-parcial'
        : 'estado-pendiente';

  return (
    <>
      <tr
        className={`reports-sale-row ${isExpanded ? 'expanded' : ''}`}
        onClick={() => onToggle(saleId)}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle(saleId);
          }
        }}
      >
        <td className="col-expand">
          <span className={`reports-chevron ${isExpanded ? 'open' : ''}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </span>
        </td>
        <td>
          <span className="reports-id-badge" title={`ID: ${saleId}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
            </svg>
            #{saleId}
          </span>
        </td>
        <td>{formatDate(venta.fecha)}</td>
        <td>{clientFullName}</td>
        <td>
          <span className="reports-product-count">
            {saleProducts.length} {saleProducts.length === 1 ? t('reports_product_singular') : t('reports_product_plural')}
          </span>
        </td>
        <td>
          <span className={`reports-pago-badge ${venta.tipo_pago === 'Abono' ? 'pago-abono' : 'pago-contado'}`}>
            {venta.tipo_pago}
          </span>
        </td>
        <td>
          <span className={`reports-status-badge ${estadoClass}`}>{estadoPago}</span>
        </td>
        <td>{formatMoney(saldoPendiente)}</td>
        <td className="col-total">{formatMoney(venta.total_venta)}</td>
      </tr>

      {isExpanded && (
        <tr className="reports-detail-row">
          <td colSpan={9}>
            <div className="reports-detail-container">
              <div className="reports-detail-header">
                <div className="reports-detail-title">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                    <line x1="1" y1="10" x2="23" y2="10" />
                  </svg>
                  <span>{t('reports_detail_breakdown')}</span>
                </div>
                <span className="reports-detail-sale-tag">#{saleId}</span>
              </div>

              <div className="reports-detail-refined">
                <div className="reports-detail-summary-line">
                  <span className="summary-label">{t('reports_col_payment')}:</span>
                  <span className="summary-value">{venta.tipo_pago}</span>
                  <span className="summary-separator">|</span>
                  <span className="summary-label">{t('reports_col_total')}:</span>
                  <span className="summary-value">{formatMoney(venta.total_venta)}</span>
                </div>

                <div className="reports-detail-summary reports-cobranza-summary">
                  <div className="reports-summary-pill">
                    <span className="reports-summary-label">{t('reports_abono_total_paid')}</span>
                    <span className="reports-summary-value">{formatMoney(totalAbonado)}</span>
                  </div>
                  <div className="reports-summary-pill">
                    <span className="reports-summary-label">{t('reports_abono_pending')}</span>
                    <span className="reports-summary-value">{formatMoney(saldoPendiente)}</span>
                  </div>
                  <div className="reports-summary-pill">
                    <span className="reports-summary-label">{t('reports_abono_status')}</span>
                    <span className="reports-summary-value">
                      <span className={`reports-status-badge ${estadoClass}`}>{estadoPago}</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="reports-products-panel">
                <div className="reports-products-head">
                  <span className="col-index">#</span>
                  <span className="col-product">{t('reports_detail_product')}</span>
                  <span className="col-qty">{t('reports_detail_qty')}</span>
                  <span className="col-unit">{t('reports_detail_unit_price')}</span>
                  <span className="col-subtotal">{t('reports_detail_subtotal')}</span>
                </div>

                {saleProducts.length === 0 ? (
                  <div className="reports-empty reports-products-empty">{t('reports_detail_no_products')}</div>
                ) : (
                  <ul className="reports-products-list">
                    {saleProducts.map((item, idx) => {
                      const name = item.nombre_producto_snapshot || `ID ${item.id_producto}`;
                      return (
                        <li key={item.id_producto_vendido ?? `${item.id_venta}-${item.id_producto}`} className="reports-product-row">
                          <span className="col-index">{idx + 1}</span>
                          <span className="col-product">{name}</span>
                          <span className="col-qty"><span className="detail-qty-badge">{item.cantidad}</span></span>
                          <span className="col-unit">{formatMoney(item.precio_unitario)}</span>
                          <span className="col-subtotal">{formatMoney(item.subtotal)}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}

                {saleProducts.length > 0 && (
                  <div className="reports-products-footer">
                    <div className="reports-products-footer-label">{t('reports_detail_sale_total')}</div>
                    <div className="reports-products-footer-qty"><span className="detail-qty-badge total">{totalQty}</span></div>
                    <div className="reports-products-footer-total">{formatMoney(venta.total_venta)}</div>
                  </div>
                )}
              </div>

              <div className="reports-detail-actions">
                <button
                  type="button"
                  className="btn-edit-outline"
                  onClick={(event) => {
                    event.stopPropagation();
                    onEditItems(venta);
                  }}
                >
                  {t('reports_items_action')}
                </button>
                <button
                  type="button"
                  className="btn-edit-outline"
                  onClick={(event) => {
                    event.stopPropagation();
                    onEditSale(venta);
                  }}
                >
                  {t('reports_edit_action')}
                </button>
                <button
                  type="button"
                  className="btn-delete-solid"
                  onClick={(event) => {
                    event.stopPropagation();
                    onDeleteSale(venta);
                  }}
                >
                  {t('reports_delete_action')}
                </button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
