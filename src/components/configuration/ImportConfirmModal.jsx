import { FileText, Warning, ShieldCheck } from 'phosphor-react';

export default function ImportConfirmModal({
  open,
  filePath,
  onConfirm,
  onCancel,
  t,
  isDark,
}) {
  if (!open || !filePath) return null;

  const fileName = filePath?.split(/[\\/]/).pop() || '';

  return (
    <div className="confirm-modal-overlay" onClick={onCancel}>
      <div className={`confirm-modal-content ${isDark ? 'confirm-modal-dark' : 'confirm-modal-light'}`}
        onClick={(e) => e.stopPropagation()}>
        <div className={`confirm-modal-icon-wrapper ${isDark ? 'confirm-modal-icon-dark' : 'confirm-modal-icon-light'}`}>
          <Warning size={32} weight="duotone" />
        </div>

        <h3 className={`confirm-modal-title ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
          {t('confirm_modal_title')}
        </h3>

        <p className={`confirm-modal-body ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          {t('confirm_modal_body')}
        </p>

        <div className={`confirm-modal-file ${isDark ? 'bg-gray-700/50 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
          <span className="confirm-modal-file-icon"><FileText size={16} weight="duotone" /></span>
          <span className="confirm-modal-file-name">{fileName}</span>
        </div>

        <div className={`confirm-modal-note ${isDark ? 'bg-emerald-900/30 text-emerald-300 border-emerald-700' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
          <ShieldCheck size={16} weight="duotone" /> {t('confirm_modal_safety_note')}
        </div>

        <div className="confirm-modal-actions">
          <button type="button" onClick={onCancel}
            className={`confirm-modal-btn confirm-modal-btn-cancel cursor-pointer ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
            {t('confirm_modal_cancel')}
          </button>
          <button type="button" onClick={onConfirm} className="confirm-modal-btn confirm-modal-btn-confirm cursor-pointer">
            {t('confirm_modal_confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
