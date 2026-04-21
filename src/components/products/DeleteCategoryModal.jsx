import { Warning, Tag } from 'phosphor-react';

export default function DeleteCategoryModal({
  open,
  category,
  onConfirm,
  onCancel,
  t,
  isDark,
}) {
  if (!open || !category) return null;

  return (
    <div className="confirm-modal-overlay" onClick={onCancel}>
      <div
        className={`confirm-modal-content ${isDark ? 'confirm-modal-dark' : 'confirm-modal-light'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`confirm-modal-icon-wrapper ${isDark ? 'confirm-modal-icon-dark' : 'confirm-modal-icon-light'}`}>
          <Warning size={32} weight="duotone" />
        </div>
        <h3 className={`confirm-modal-title ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
          {t('delete_cat_modal_title')}
        </h3>
        <p className={`confirm-modal-body ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          {t('delete_cat_modal_body')}
        </p>
        <div className={`confirm-modal-file ${isDark ? 'bg-gray-700/50 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
          <span className="confirm-modal-file-icon"><Tag size={16} weight="duotone" /></span>
          <span className="confirm-modal-file-name">{category.nombre}</span>
        </div>
        <div className={`confirm-modal-note ${isDark ? 'bg-amber-900/30 text-amber-300 border-amber-700' : 'bg-amber-50 text-amber-800 border-amber-200'}`}>
          <Warning size={16} weight="duotone" /> {t('delete_cat_modal_warning')}
        </div>
        <div className="confirm-modal-actions">
          <button
            type="button"
            onClick={onCancel}
            className={`confirm-modal-btn confirm-modal-btn-cancel ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            {t('confirm_modal_cancel')}
          </button>
          <button type="button" onClick={onConfirm} className="confirm-modal-btn confirm-modal-btn-confirm">
            {t('delete_cat_modal_confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
