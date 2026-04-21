import { Archive, ChartBar, FloppyDisk } from 'phosphor-react';

export default function ReportsExportSection({
  t,
  isExporting,
  isBackingUp,
  onExportXLSX,
  onBackupDB,
}) {
  return (
    <section className="reports-section">
      <div className="reports-card reports-card-full reports-export-card">
        <div className="reports-export-header">
          <div className="reports-export-icon">
            <Archive size={22} weight="duotone" />
          </div>
          <div>
            <h2>{t('reports_export_title')}</h2>
            <p>{t('reports_export_desc')}</p>
          </div>
        </div>

        <div className="reports-export-actions">
          <button
            type="button"
            className="reports-export-btn reports-export-csv"
            onClick={onExportXLSX}
            disabled={isExporting}
          >
            <span className="export-btn-icon">
              <ChartBar size={26} weight="duotone" />
            </span>
            <div className="export-btn-text">
              <strong>{isExporting ? '...' : t('reports_export_csv_btn')}</strong>
              <span>{t('reports_export_csv_desc')}</span>
            </div>
          </button>

          <button
            type="button"
            className="reports-export-btn reports-export-backup"
            onClick={onBackupDB}
            disabled={isBackingUp}
          >
            <span className="export-btn-icon">
              <FloppyDisk size={26} weight="duotone" />
            </span>
            <div className="export-btn-text">
              <strong>{isBackingUp ? '...' : t('reports_backup_btn')}</strong>
              <span>{t('reports_backup_desc')}</span>
            </div>
          </button>
        </div>
      </div>
    </section>
  );
}
