import { useMemo, useState } from 'react';

const parseNotes = (rawNotes) => {
  if (!rawNotes) return [];
  return rawNotes
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[-*]\s+/, ''));
};

const formatBytes = (bytes) => {
  if (!bytes && bytes !== 0) return '';
  if (bytes === 0) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(value >= 10 || i === 0 ? 0 : 1)} ${sizes[i]}`;
};

export default function UpdateModal({
  mode = 'update',
  open,
  stage,
  currentVersion,
  nextVersion,
  updateSize,
  notes,
  isDark,
  progressPercent,
  etaLabel,
  onConfirm,
  onDefer,
  onClose,
  t,
}) {
  const [showDetails, setShowDetails] = useState(false);
  const noteItems = useMemo(() => parseNotes(notes), [notes]);
  const highlights = noteItems.slice(0, 3);
  const hasDetails = noteItems.length > 3;
  const sizeLabel = updateSize ? formatBytes(updateSize) : '';
  const isBusy = stage === 'downloading' || stage === 'installing';
  const isPatchNotes = mode === 'patchNotes';

  if (!open) return null;

  // ── Modo "Notas del parche" (post‑actualización) ──
  if (isPatchNotes) {
    return (
      <div className="update-modal-overlay" role="dialog" aria-modal="true">
        <div className={`update-modal-card ${isDark ? 'update-card-dark' : 'update-card-light'}`}>
          <div className="update-modal-header">
            <div className={`update-pill update-pill-success ${isDark ? 'update-pill-success-dark' : 'update-pill-success-light'}`}>
              {t('patch_modal_badge')}
            </div>
            <button type="button" className="update-close" onClick={onClose} aria-label={t('update_modal_close')}>
              ×
            </button>
          </div>

          <div className="patch-icon-row">
            <span className="patch-check-icon">✓</span>
          </div>

          <h2 className="update-title">{t('patch_modal_title')}</h2>
          <p className="update-subtitle">{t('patch_modal_subtitle')}</p>

          <div className={`update-version ${isDark ? 'update-version-dark' : 'update-version-light'}`}>
            <span className="update-version-new">{nextVersion || currentVersion || '—'}</span>
          </div>

          <div className="update-highlights">
            <div className="update-section-title">{t('patch_modal_whats_new')}</div>
            {noteItems.length === 0 ? (
              <p className="update-empty">{t('update_modal_no_notes')}</p>
            ) : (
              <>
                <ul>
                  {highlights.map((item, index) => (
                    <li key={`${item}-${index}`}>{item}</li>
                  ))}
                </ul>
                {hasDetails && (
                  <div className="update-details" style={{ marginTop: '0.75rem' }}>
                    <button
                      type="button"
                      className="update-link"
                      onClick={() => setShowDetails((prev) => !prev)}
                    >
                      {showDetails ? t('update_modal_hide_details') : t('update_modal_show_details')}
                    </button>
                    {showDetails && (
                      <div className={`update-notes ${isDark ? 'update-notes-dark' : 'update-notes-light'}`}>
                        <ul>
                          {noteItems.slice(3).map((item, index) => (
                            <li key={`rest-${item}-${index}`}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="update-actions" style={{ gridTemplateColumns: '1fr' }}>
            <button type="button" className="update-btn update-btn-primary" onClick={onConfirm}>
              {t('patch_modal_cta')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Modo "Actualización disponible" ──
  return (
    <div className="update-modal-overlay" role="dialog" aria-modal="true">
      <div className={`update-modal-card ${isDark ? 'update-card-dark' : 'update-card-light'}`}>
        <div className="update-modal-header">
          <div className={`update-pill ${isDark ? 'update-pill-dark' : 'update-pill-light'}`}>
            {t('update_modal_badge')}
          </div>
          <button
            type="button"
            className="update-close"
            onClick={onClose}
            disabled={isBusy}
            aria-label={t('update_modal_close')}
          >
            ×
          </button>
        </div>

        <h2 className="update-title">{t('update_modal_title')}</h2>
        <p className="update-subtitle">{t('update_modal_subtitle')}</p>

        <div className={`update-version ${isDark ? 'update-version-dark' : 'update-version-light'}`}>
          <span>{currentVersion || '—'}</span>
          <span className="update-version-arrow">→</span>
          <span className="update-version-new">{nextVersion || '—'}</span>
        </div>

        <div className="update-meta">
          <div className={`update-meta-card ${isDark ? 'update-meta-dark' : 'update-meta-light'}`}>
            <span className="update-meta-label">{t('update_modal_size_label')}</span>
            <span className="update-meta-value">{sizeLabel || t('update_modal_size_unknown')}</span>
          </div>
          <div className={`update-meta-card ${isDark ? 'update-meta-dark' : 'update-meta-light'}`}>
            <span className="update-meta-label">{t('update_modal_changes_label')}</span>
            <span className="update-meta-value">{t('update_modal_changes_summary')}</span>
          </div>
        </div>

        <div className="update-highlights">
          <div className="update-section-title">{t('update_modal_highlights')}</div>
          {highlights.length === 0 ? (
            <p className="update-empty">{t('update_modal_no_notes')}</p>
          ) : (
            <ul>
              {highlights.map((item, index) => (
                <li key={`${item}-${index}`}>{item}</li>
              ))}
            </ul>
          )}
        </div>

        <div className="update-details">
          <button
            type="button"
            className="update-link"
            onClick={() => setShowDetails((prev) => !prev)}
          >
            {showDetails ? t('update_modal_hide_details') : t('update_modal_show_details')}
          </button>
          {showDetails && (
            <div className={`update-notes ${isDark ? 'update-notes-dark' : 'update-notes-light'}`}>
              <div className="update-section-title">{t('update_modal_full_notes')}</div>
              {noteItems.length === 0 ? (
                <p className="update-empty">{t('update_modal_no_notes')}</p>
              ) : (
                <ul>
                  {noteItems.map((item, index) => (
                    <li key={`${item}-${index}`}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {isBusy && (
          <div className="update-progress">
            <div className="update-progress-row">
              <span>{stage === 'downloading' ? t('update_modal_downloading') : t('update_modal_installing')}</span>
              <span>{etaLabel || t('update_modal_eta_calc')}</span>
            </div>
            <div className="update-progress-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100}>
              <div
                className="update-progress-fill"
                style={{ width: `${Math.min(progressPercent || 0, 100)}%` }}
              />
            </div>
          </div>
        )}

        <div className="update-actions">
          <button
            type="button"
            className="update-btn update-btn-primary"
            onClick={onConfirm}
            disabled={isBusy}
          >
            {t('update_modal_cta_primary')}
          </button>
          <button
            type="button"
            className="update-btn update-btn-secondary"
            onClick={onDefer}
            disabled={isBusy}
          >
            {t('update_modal_cta_secondary')}
          </button>
        </div>

        {hasDetails && !showDetails && (
          <div className="update-footnote">{t('update_modal_details_hint')}</div>
        )}
      </div>
    </div>
  );
}
