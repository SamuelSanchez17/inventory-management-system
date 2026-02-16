import { useContext, useEffect, useMemo, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { invoke, isTauri } from '@tauri-apps/api/core';
import { save } from '@tauri-apps/plugin-dialog';
import Sidebar from '../components/sidebar';
import { ThemeContext } from '../context/ThemeContext';
import { LanguageContext } from '../context/LanguageContext';
import '../styles/reports.css';

export default function Reports({ onNavigate, currentPage, isSidebarCollapsed, toggleSidebar }) {
    const { getActiveTheme } = useContext(ThemeContext);
    const { t, language } = useContext(LanguageContext);
    const isDark = getActiveTheme() === 'oscuro';
    const [sales, setSales] = useState([]);
    const [soldProducts, setSoldProducts] = useState([]);
    const [itemsPerPage, setItemsPerPage] = useState(8);
    const [pageIndex, setPageIndex] = useState(1);
    const [expandedSales, setExpandedSales] = useState(new Set());

    useEffect(() => {
        const loadReportsData = async () => {
            if (!isTauri()) {
                return;
            }

            try {
                const [salesData, soldData] = await Promise.all([
                    invoke('list_ventas'),
                    invoke('list_productos_vendidos'),
                ]);

                setSales(Array.isArray(salesData) ? salesData : []);
                setSoldProducts(Array.isArray(soldData) ? soldData : []);
            } catch (error) {
                console.error('Error al cargar reportes:', error);
                toast.error(t('toast_reports_load_error'));
            }
        };

        loadReportsData();
    }, []);

    const productsBySaleId = useMemo(() => {
        const map = new Map();
        soldProducts.forEach((item) => {
            if (!map.has(item.id_venta)) {
                map.set(item.id_venta, []);
            }
            map.get(item.id_venta).push(item);
        });
        return map;
    }, [soldProducts]);

    const formatDate = (value) => {
        if (!value) return '';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return value;
        }
        return date.toLocaleDateString(language === 'en' ? 'en-US' : 'es-ES');
    };

    const formatMoney = (value) => {
        const numberValue = Number(value);
        if (Number.isNaN(numberValue)) {
            return '$0.00';
        }
        return `$${numberValue.toFixed(2)}`;
    };

    const toggleExpanded = useCallback((saleId) => {
        setExpandedSales((prev) => {
            const next = new Set(prev);
            if (next.has(saleId)) {
                next.delete(saleId);
            } else {
                next.add(saleId);
            }
            return next;
        });
    }, []);

    const expandAll = useCallback(() => {
        setExpandedSales(new Set(sales.map((s) => s.id_venta)));
    }, [sales]);

    const collapseAll = useCallback(() => {
        setExpandedSales(new Set());
    }, []);

    const [isExporting, setIsExporting] = useState(false);
    const [isBackingUp, setIsBackingUp] = useState(false);

    const handleExportCSV = async () => {
        if (!isTauri()) return;

        try {
            const today = new Date().toISOString().split('T')[0];
            const filePath = await save({
                defaultPath: `inventario_${today}.csv`,
                filters: [{ name: 'CSV', extensions: ['csv'] }],
            });

            if (!filePath) {
                toast(t('toast_export_csv_cancelled'), { icon: 'ℹ️' });
                return;
            }

            setIsExporting(true);
            await invoke('export_all_csv', { rutaDestino: filePath });
            toast.success(t('toast_export_csv_success'));
        } catch (error) {
            console.error('Error exporting CSV:', error);
            toast.error(t('toast_export_csv_error'));
        } finally {
            setIsExporting(false);
        }
    };

    const handleBackupDB = async () => {
        if (!isTauri()) return;

        try {
            const today = new Date().toISOString().split('T')[0];
            const filePath = await save({
                defaultPath: `respaldo_inventario_${today}.db`,
                filters: [{ name: 'Database', extensions: ['db'] }],
            });

            if (!filePath) {
                toast(t('toast_backup_cancelled'), { icon: 'ℹ️' });
                return;
            }

            setIsBackingUp(true);
            await invoke('backup_database', { rutaDestino: filePath });
            toast.success(t('toast_backup_success'));
        } catch (error) {
            console.error('Error backing up DB:', error);
            toast.error(t('toast_backup_error'));
        } finally {
            setIsBackingUp(false);
        }
    };

    const totalItems = sales.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
    const safePageIndex = Math.min(pageIndex, totalPages);
    const startIndex = (safePageIndex - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    const pagedSales = useMemo(
        () => sales.slice(startIndex, endIndex),
        [sales, startIndex, endIndex]
    );

    const totalProductos = soldProducts.length;

    useEffect(() => {
        if (pageIndex !== safePageIndex) {
            setPageIndex(safePageIndex);
        }
    }, [pageIndex, safePageIndex]);

    return (
        <div className={`min-h-screen flex ${isDark ? 'reports-dark' : ''}`}>
            <Sidebar
                onNavigate={onNavigate}
                activePage={currentPage}
                isCollapsed={isSidebarCollapsed}
                toggleSidebar={toggleSidebar}
            />

            <main className="reports-page">
                <header className="reports-header">
                    <div>
                        <h1>{t('reports_title')}</h1>
                        <p>{t('reports_subtitle')}</p>
                    </div>
                    <div className="reports-summary">
                        <div className="reports-chip">
                            <span className="chip-label">{t('reports_chip_sales')}</span>
                            <span className="chip-value">{totalItems}</span>
                        </div>
                        <div className="reports-chip">
                            <span className="chip-label">{t('reports_chip_products')}</span>
                            <span className="chip-value">{totalProductos}</span>
                        </div>
                    </div>
                </header>

                <section className="reports-section">
                    <div className="reports-card reports-card-full">
                        <div className="reports-card-header">
                            <h2>{t('reports_detail_title')}</h2>
                            <div className="reports-expand-controls">
                                <button type="button" className="reports-expand-btn" onClick={expandAll} title="Expandir todas">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="7 13 12 18 17 13" />
                                        <polyline points="7 6 12 11 17 6" />
                                    </svg>
                                    {t('reports_expand')}
                                </button>
                                <button type="button" className="reports-expand-btn" onClick={collapseAll} title="Minimizar todas">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="17 11 12 6 7 11" />
                                        <polyline points="17 18 12 13 7 18" />
                                    </svg>
                                    {t('reports_collapse')}
                                </button>
                            </div>
                        </div>

                        <div className="reports-table-wrapper">
                            <table className="reports-table reports-unified">
                                <thead>
                                    <tr>
                                        <th className="col-expand"></th>
                                        <th>{t('reports_col_sale')}</th>
                                        <th>{t('reports_col_date')}</th>
                                        <th>{t('reports_col_client')}</th>
                                        <th>{t('reports_col_products')}</th>
                                        <th>{t('reports_col_payment')}</th>
                                        <th className="col-total">{t('reports_col_total')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pagedSales.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="reports-empty">{t('reports_no_sales')}</td>
                                        </tr>
                                    ) : (
                                        pagedSales.map((venta) => {
                                            const saleId = venta.id_venta;
                                            const isExpanded = expandedSales.has(saleId);
                                            const saleProducts = productsBySaleId.get(saleId) || [];
                                            return (
                                                <SaleRow
                                                    key={saleId ?? `${venta.fecha}-${venta.nombre_clienta}`}
                                                    venta={venta}
                                                    saleProducts={saleProducts}
                                                    isExpanded={isExpanded}
                                                    onToggle={toggleExpanded}
                                                    formatDate={formatDate}
                                                    formatMoney={formatMoney}
                                                    t={t}
                                                />
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="reports-pagination">
                            <span>
                                {totalItems === 0
                                    ? `0 - 0 ${t('reports_of')} 0`
                                    : `${startIndex + 1} - ${endIndex} ${t('reports_of')} ${totalItems}`}
                            </span>
                            <div className="reports-pagination-controls">
                                <label className="reports-items-per-page">
                                    <span>{t('reports_show')}</span>
                                    <select
                                        value={itemsPerPage}
                                        onChange={(event) => {
                                            setItemsPerPage(Number(event.target.value));
                                            setPageIndex(1);
                                        }}
                                    >
                                        {[8, 12, 16, 24].map((size) => (
                                            <option key={size} value={size}>{size}</option>
                                        ))}
                                    </select>
                                </label>
                                <span className="reports-pagination-buttons">
                                    <button
                                        type="button"
                                        onClick={() => setPageIndex((prev) => Math.max(1, prev - 1))}
                                        disabled={safePageIndex === 1}
                                    >
                                        {'<'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPageIndex((prev) => Math.min(totalPages, prev + 1))}
                                        disabled={safePageIndex === totalPages}
                                    >
                                        {'>'}
                                    </button>
                                </span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Sección de Exportación y Respaldo */}
                <section className="reports-section">
                    <div className="reports-card reports-card-full reports-export-card">
                        <div className="reports-export-header">
                            <div className="reports-export-icon">🗂️</div>
                            <div>
                                <h2>{t('reports_export_title')}</h2>
                                <p>{t('reports_export_desc')}</p>
                            </div>
                        </div>

                        <div className="reports-export-actions">
                            <button
                                type="button"
                                className="reports-export-btn reports-export-csv"
                                onClick={handleExportCSV}
                                disabled={isExporting}
                            >
                                <span className="export-btn-icon">📊</span>
                                <div className="export-btn-text">
                                    <strong>{isExporting ? '...' : t('reports_export_csv_btn')}</strong>
                                    <span>{t('reports_export_csv_desc')}</span>
                                </div>
                            </button>

                            <button
                                type="button"
                                className="reports-export-btn reports-export-backup"
                                onClick={handleBackupDB}
                                disabled={isBackingUp}
                            >
                                <span className="export-btn-icon">💾</span>
                                <div className="export-btn-text">
                                    <strong>{isBackingUp ? '...' : t('reports_backup_btn')}</strong>
                                    <span>{t('reports_backup_desc')}</span>
                                </div>
                            </button>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}

function SaleRow({ venta, saleProducts, isExpanded, onToggle, formatDate, formatMoney, t }) {
    const saleId = venta.id_venta;
    const totalQty = saleProducts.reduce((sum, p) => sum + p.cantidad, 0);

    return (
        <>
            <tr
                className={`reports-sale-row ${isExpanded ? 'expanded' : ''}`}
                onClick={() => onToggle(saleId)}
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(saleId); } }}
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
                <td>{venta.nombre_clienta}</td>
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
                <td className="col-total">{formatMoney(venta.total_venta)}</td>
            </tr>

            {isExpanded && (
                <tr className="reports-detail-row">
                    <td colSpan={7}>
                        <div className="reports-detail-container">
                            <div className="reports-detail-header">
                                <div className="reports-detail-title">
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                                        <line x1="1" y1="10" x2="23" y2="10" />
                                    </svg>
                                    <span>{t('reports_detail_breakdown')}</span>
                                </div>
                                <div className="reports-detail-meta">
                                    <span className="detail-meta-item">
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                            <line x1="16" y1="2" x2="16" y2="6" />
                                            <line x1="8" y1="2" x2="8" y2="6" />
                                            <line x1="3" y1="10" x2="21" y2="10" />
                                        </svg>
                                        {formatDate(venta.fecha)}
                                    </span>
                                    <span className="detail-meta-item">
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                                            <circle cx="12" cy="7" r="4" />
                                        </svg>
                                        {venta.nombre_clienta}
                                    </span>
                                </div>
                            </div>

                            <table className="reports-detail-table">
                                <thead>
                                    <tr>
                                        <th className="dt-col-num">#</th>
                                        <th className="dt-col-product">{t('reports_detail_product')}</th>
                                        <th className="dt-col-qty">{t('reports_detail_qty')}</th>
                                        <th className="dt-col-price">{t('reports_detail_unit_price')}</th>
                                        <th className="dt-col-subtotal">{t('reports_detail_subtotal')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {saleProducts.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="reports-empty">{t('reports_detail_no_products')}</td>
                                        </tr>
                                    ) : (
                                        saleProducts.map((item, idx) => {
                                            const name = item.nombre_producto_snapshot || `ID ${item.id_producto}`;
                                            return (
                                                <tr key={item.id_producto_vendido ?? `${item.id_venta}-${item.id_producto}`}>
                                                    <td className="dt-col-num">{idx + 1}</td>
                                                    <td className="dt-col-product">
                                                        <span className="detail-product-name">{name}</span>
                                                    </td>
                                                    <td className="dt-col-qty">
                                                        <span className="detail-qty-badge">{item.cantidad}</span>
                                                    </td>
                                                    <td className="dt-col-price">{formatMoney(item.precio_unitario)}</td>
                                                    <td className="dt-col-subtotal">{formatMoney(item.subtotal)}</td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                                {saleProducts.length > 0 && (
                                    <tfoot>
                                        <tr className="reports-detail-footer">
                                            <td colSpan={2} className="dt-footer-label">{t('reports_detail_sale_total')}</td>
                                            <td className="dt-col-qty">
                                                <span className="detail-qty-badge total">{totalQty}</span>
                                            </td>
                                            <td></td>
                                            <td className="dt-col-subtotal dt-footer-total">{formatMoney(venta.total_venta)}</td>
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
}
