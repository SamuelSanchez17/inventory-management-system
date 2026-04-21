export default function ReportsEditSaleModal({
  open,
  t,
  onClose,
  editForm,
  setEditForm,
  formatMoney,
  modalIsAbono,
  modalTotalAbonado,
  modalSaldoPendiente,
  modalEstadoClass,
  modalEstadoPago,
  nuevoAbonoEdit,
  setNuevoAbonoEdit,
  onRegistrarAbono,
  isSavingEditAbono,
  isLoadingEditAbonos,
  editAbonos,
  formatDate,
  onSave,
  isUpdatingSale,
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="reports-modal-overlay" onClick={onClose}>
      <div className="reports-modal" onClick={(event) => event.stopPropagation()}>
        <div className="reports-modal-header">
          <h3>{t('reports_edit_title')}</h3>
          <p>{t('reports_edit_desc')}</p>
        </div>
        <div className="reports-modal-body">
          <label className="reports-modal-field">
            {t('reports_edit_date')}
            <input
              type="datetime-local"
              value={editForm.fecha}
              onChange={(event) => setEditForm((prev) => ({ ...prev, fecha: event.target.value }))}
            />
          </label>
          <label className="reports-modal-field">
            {t('reports_edit_client')}
            <input
              type="text"
              value={editForm.nombre_clienta}
              onChange={(event) => setEditForm((prev) => ({ ...prev, nombre_clienta: event.target.value }))}
            />
          </label>
          <label className="reports-modal-field">
            {t('reports_edit_lastname')}
            <input
              type="text"
              value={editForm.apellido_clienta}
              onChange={(event) => setEditForm((prev) => ({ ...prev, apellido_clienta: event.target.value }))}
            />
          </label>
          <label className="reports-modal-field">
            {t('reports_edit_payment')}
            <select
              value={editForm.tipo_pago}
              onChange={(event) => setEditForm((prev) => ({ ...prev, tipo_pago: event.target.value }))}
            >
              <option value="Contado">{t('reports_edit_payment_contado')}</option>
              <option value="Abono">{t('reports_edit_payment_abono')}</option>
            </select>
          </label>
          <div className="reports-modal-field">
            {t('reports_edit_total')}
            <div className="reports-modal-readonly">{formatMoney(editForm.total_venta)}</div>
          </div>

          {modalIsAbono && (
            <div className="reports-modal-abonos">
              <div className="reports-modal-abonos-header">
                <h4>{t('reports_abono_modal_title')}</h4>
                <p>{t('reports_abono_modal_desc')}</p>
              </div>

              <div className="reports-detail-summary reports-cobranza-summary reports-modal-cobranza-summary">
                <div className="reports-summary-pill">
                  <span className="reports-summary-label">{t('reports_abono_total_paid')}</span>
                  <span className="reports-summary-value">{formatMoney(modalTotalAbonado)}</span>
                </div>
                <div className="reports-summary-pill">
                  <span className="reports-summary-label">{t('reports_abono_pending')}</span>
                  <span className="reports-summary-value">{formatMoney(modalSaldoPendiente)}</span>
                </div>
                <div className="reports-summary-pill">
                  <span className="reports-summary-label">{t('reports_abono_status')}</span>
                  <span className="reports-summary-value">
                    <span className={`reports-status-badge ${modalEstadoClass}`}>{modalEstadoPago}</span>
                  </span>
                </div>
              </div>

              <div className="reports-modal-abonos-add">
                <label className="reports-modal-field">
                  {t('reports_abono_add_label')}
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder={t('reports_abono_add_placeholder')}
                    value={nuevoAbonoEdit}
                    onChange={(event) => setNuevoAbonoEdit(event.target.value)}
                  />
                </label>
                <button
                  type="button"
                  className="reports-abono-add-btn"
                  onClick={onRegistrarAbono}
                  disabled={isSavingEditAbono || modalEstadoPago === 'Liquidada'}
                >
                  {isSavingEditAbono ? t('reports_abono_add_saving') : t('reports_abono_add_btn')}
                </button>
              </div>

              <div className="reports-modal-abonos-history">
                <div className="reports-abonos-history-head">{t('reports_abono_history_title')}</div>
                {isLoadingEditAbonos ? (
                  <div className="reports-abonos-empty">{t('reports_abono_loading')}</div>
                ) : editAbonos.length === 0 ? (
                  <div className="reports-abonos-empty">{t('reports_abono_history_empty')}</div>
                ) : (
                  <ul className="reports-abonos-list">
                    {editAbonos.map((abono) => (
                      <li key={abono.id_abono} className="reports-abono-row">
                        <span className="reports-abono-date">{formatDate(abono.fecha_abono)}</span>
                        <span className="reports-abono-amount">{formatMoney(abono.monto_abono)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="reports-modal-actions">
          <button type="button" className="reports-modal-button reports-modal-secondary" onClick={onClose}>
            {t('reports_edit_cancel')}
          </button>
          <button
            type="button"
            className="reports-modal-button reports-modal-primary"
            onClick={onSave}
            disabled={isUpdatingSale}
          >
            {isUpdatingSale ? '...' : t('reports_edit_save')}
          </button>
        </div>
      </div>
    </div>
  );
}
