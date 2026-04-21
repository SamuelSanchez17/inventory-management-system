export default function ReportsDeleteSaleModal({
  open,
  t,
  onClose,
  onConfirmDelete,
  isDeletingSale,
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="reports-modal-overlay" onClick={onClose}>
      <div className="reports-modal reports-modal-compact" onClick={(event) => event.stopPropagation()}>
        <div className="reports-modal-header">
          <h3>{t('reports_delete_title')}</h3>
          <p>{t('reports_delete_desc')}</p>
        </div>
        <div className="reports-modal-body">
          <p className="reports-modal-text">{t('reports_delete_warning')}</p>
        </div>
        <div className="reports-modal-actions">
          <button type="button" className="reports-modal-button reports-modal-secondary" onClick={onClose}>
            {t('reports_delete_cancel')}
          </button>
          <button
            type="button"
            className="reports-modal-button reports-modal-danger"
            onClick={onConfirmDelete}
            disabled={isDeletingSale}
          >
            {isDeletingSale ? '...' : t('reports_delete_confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
