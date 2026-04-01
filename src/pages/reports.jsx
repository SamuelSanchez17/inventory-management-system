import { useContext, useEffect, useMemo, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { invoke, isTauri } from '@tauri-apps/api/core';
import { Archive, CaretLeft, CaretRight, ChartBar, FloppyDisk } from 'phosphor-react';
import { save } from '@tauri-apps/plugin-dialog';
import Sidebar from '../components/sidebar';
import { ThemeContext } from '../context/ThemeContext';
import { LanguageContext } from '../context/LanguageContext';
import '../styles/reports.css';

export default function Reports({ onNavigate, currentPage, isSidebarCollapsed, toggleSidebar, profile }) {
    const { getActiveTheme } = useContext(ThemeContext);
    const { t, language } = useContext(LanguageContext);
    const isDark = getActiveTheme() === 'oscuro';
    const [sales, setSales] = useState([]);
    const [soldProducts, setSoldProducts] = useState([]);
    const [products, setProducts] = useState([]);
    const [itemsPerPage, setItemsPerPage] = useState(8);
    const [pageIndex, setPageIndex] = useState(1);
    const [expandedSales, setExpandedSales] = useState(new Set());

    const loadReportsData = useCallback(async () => {
        if (!isTauri()) {
            return;
        }

        try {
            const [salesData, soldData, productsData] = await Promise.all([
                invoke('list_ventas_con_cobranza'),
                invoke('list_productos_vendidos'),
                invoke('list_productos'),
            ]);

            setSales(Array.isArray(salesData) ? salesData : []);
            setSoldProducts(Array.isArray(soldData) ? soldData : []);
            setProducts(Array.isArray(productsData) ? productsData : []);
        } catch (error) {
            console.error('Error al cargar reportes:', error);
            toast.error(t('toast_reports_load_error'));
        }
    }, [t]);

    useEffect(() => {
        loadReportsData();
    }, [loadReportsData]);

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

    const productsById = useMemo(
        () => new Map(products.map((product) => [product.id_producto, product])),
        [products]
    );

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

    const toInputDateTime = (value) => {
        if (!value) return '';
        if (value.includes('T')) {
            return value.slice(0, 16);
        }
        if (value.includes(' ')) {
            return value.replace(' ', 'T').slice(0, 16);
        }
        return value;
    };

    const fromInputDateTime = (value) => {
        if (!value) return '';
        if (value.includes('T')) {
            const [datePart, timePart] = value.split('T');
            return `${datePart} ${timePart}:00`;
        }
        return value;
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
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isUpdatingSale, setIsUpdatingSale] = useState(false);
    const [isDeletingSale, setIsDeletingSale] = useState(false);
    const [isItemsModalOpen, setIsItemsModalOpen] = useState(false);
    const [isSavingItems, setIsSavingItems] = useState(false);
    const [activeSale, setActiveSale] = useState(null);
    const [editForm, setEditForm] = useState({
        fecha: '',
        nombre_clienta: '',
        apellido_clienta: '',
        tipo_pago: 'Contado',
        total_venta: 0,
    });
    const [editItems, setEditItems] = useState([]);
    const [deletedItemIds, setDeletedItemIds] = useState([]);
    const [editAbonos, setEditAbonos] = useState([]);
    const [isLoadingEditAbonos, setIsLoadingEditAbonos] = useState(false);
    const [nuevoAbonoEdit, setNuevoAbonoEdit] = useState('');
    const [isSavingEditAbono, setIsSavingEditAbono] = useState(false);

    const fetchAbonosBySale = useCallback(async (saleId) => {
        if (!isTauri()) {
            return [];
        }

        try {
            const abonos = await invoke('list_abonos_por_venta', { idVenta: saleId });
            return Array.isArray(abonos) ? abonos : [];
        } catch (error) {
            console.error(`Error loading abonos for sale #${saleId}:`, error);
            return [];
        }
    }, []);

    const handleExportXLSX = async () => {
        if (!isTauri()) return;

        try {
            const today = new Date().toISOString().split('T')[0];
            const filePath = await save({
                defaultPath: `inventario_${today}.xlsx`,
                filters: [{ name: 'Excel', extensions: ['xlsx'] }],
            });

            if (!filePath) {
                toast(t('toast_export_csv_cancelled'), { icon: 'ℹ️' });
                return;
            }

            setIsExporting(true);
            await invoke('export_all_xlsx', { rutaDestino: filePath });
            toast.success(t('toast_export_csv_success'));
        } catch (error) {
            console.error('Error exporting XLSX:', error);
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

    const handleOpenEditSale = (venta) => {
        setActiveSale(venta);
        setEditForm({
            fecha: toInputDateTime(venta.fecha),
            nombre_clienta: venta.nombre_clienta ?? '',
            apellido_clienta: venta.apellido_clienta ?? '',
            tipo_pago: venta.tipo_pago ?? 'Contado',
            total_venta: venta.total_venta ?? 0,
        });
        setEditAbonos([]);
        setNuevoAbonoEdit('');
        setIsEditModalOpen(true);

        if (venta.tipo_pago !== 'Abono') {
            return;
        }

        setIsLoadingEditAbonos(true);
        fetchAbonosBySale(venta.id_venta)
            .then((abonos) => {
                setEditAbonos(abonos);
            })
            .finally(() => {
                setIsLoadingEditAbonos(false);
            });
    };

    const handleCloseEditSale = () => {
        setIsEditModalOpen(false);
        setActiveSale(null);
        setEditAbonos([]);
        setNuevoAbonoEdit('');
    };

    const handleOpenDeleteSale = (venta) => {
        setActiveSale(venta);
        setIsDeleteModalOpen(true);
    };

    const handleCloseDeleteSale = () => {
        setIsDeleteModalOpen(false);
        setActiveSale(null);
    };

    const handleSaveSale = async () => {
        if (!activeSale || !isTauri()) return;
        const nombre_clienta = editForm.nombre_clienta.trim();
        if (!nombre_clienta) {
            toast.error(t('reports_edit_name_required'));
            return;
        }

        const apellido_clienta = editForm.apellido_clienta.trim();
        if (!apellido_clienta) {
            toast.error(t('reports_edit_lastname_required'));
            return;
        }

        const updatedSale = {
            id_venta: activeSale.id_venta,
            fecha: fromInputDateTime(editForm.fecha),
            nombre_clienta,
            apellido_clienta,
            total_venta: activeSale.total_venta,
            tipo_pago: editForm.tipo_pago,
        };

        try {
            setIsUpdatingSale(true);
            await invoke('update_venta', { venta: updatedSale });

            let cobranzaPatch;
            if (updatedSale.tipo_pago === 'Contado') {
                cobranzaPatch = {
                    total_abonado: Number(updatedSale.total_venta || 0),
                    saldo_pendiente: 0,
                    estado_pago: 'Liquidada',
                };
            } else {
                const summary = await invoke('get_cobranza_summary', { idVenta: activeSale.id_venta });
                cobranzaPatch = {
                    total_abonado: Number(summary?.total_abonado || 0),
                    saldo_pendiente: Number(summary?.saldo_pendiente || 0),
                    estado_pago: summary?.estado_pago || 'Pendiente',
                };
            }

            setSales((prev) => prev.map((s) => (
                s.id_venta === activeSale.id_venta ? { ...s, ...updatedSale, ...cobranzaPatch } : s
            )));
            toast.success(t('toast_sale_updated'));
            handleCloseEditSale();
        } catch (error) {
            console.error('Error updating sale:', error);
            toast.error(t('toast_sale_update_error'));
        } finally {
            setIsUpdatingSale(false);
        }
    };

    const handleConfirmDeleteSale = async () => {
        if (!activeSale || !isTauri()) return;
        try {
            setIsDeletingSale(true);
            await invoke('delete_venta', { id: activeSale.id_venta });
            setSales((prev) => prev.filter((s) => s.id_venta !== activeSale.id_venta));
            setSoldProducts((prev) => prev.filter((p) => p.id_venta !== activeSale.id_venta));
            setExpandedSales((prev) => {
                const next = new Set(prev);
                next.delete(activeSale.id_venta);
                return next;
            });
            toast.success(t('toast_sale_deleted'));
            handleCloseDeleteSale();
        } catch (error) {
            console.error('Error deleting sale:', error);
            toast.error(t('toast_sale_delete_error'));
        } finally {
            setIsDeletingSale(false);
        }
    };

    const handleOpenItemsEdit = (venta) => {
        const saleItems = productsBySaleId.get(venta.id_venta) || [];
        setActiveSale(venta);
        setEditItems(
            saleItems.map((item) => ({
                id_producto_vendido: item.id_producto_vendido,
                id_venta: item.id_venta,
                id_producto: item.id_producto,
                nombre_producto_snapshot: item.nombre_producto_snapshot,
                cantidad: item.cantidad,
                precio_unitario: item.precio_unitario,
                subtotal: item.subtotal,
                original_id_producto: item.id_producto,
                original_cantidad: item.cantidad,
            }))
        );
        setDeletedItemIds([]);
        setIsItemsModalOpen(true);
    };

    const handleCloseItemsEdit = () => {
        setIsItemsModalOpen(false);
        setEditItems([]);
        setDeletedItemIds([]);
        setActiveSale(null);
    };

    const usedProductIds = useMemo(
        () => new Set(editItems.map((item) => item.id_producto)),
        [editItems]
    );

    const handleAddItem = () => {
        const available = products.filter((p) => !usedProductIds.has(p.id_producto));
        if (available.length === 0) {
            toast.error(t('reports_items_no_products'));
            return;
        }
        const firstProduct = available[0];
        setEditItems((prev) => ([
            ...prev,
            {
                temp_id: `new-${Date.now()}`,
                id_producto: firstProduct.id_producto,
                nombre_producto_snapshot: firstProduct.nombre_producto,
                cantidad: 1,
                precio_unitario: firstProduct.precio,
                subtotal: firstProduct.precio,
            },
        ]));
    };

    const handleRemoveItem = (item) => {
        if (item.id_producto_vendido) {
            setDeletedItemIds((prev) => [...prev, item.id_producto_vendido]);
        }
        setEditItems((prev) => prev.filter((row) => row !== item));
    };

    const handleItemProductChange = (index, productId) => {
        const product = productsById.get(Number(productId));
        setEditItems((prev) => prev.map((row, i) => {
            if (i !== index) return row;
            const precio_unitario = product?.precio ?? 0;
            return {
                ...row,
                id_producto: product?.id_producto ?? null,
                nombre_producto_snapshot: product?.nombre_producto ?? '',
                precio_unitario,
                cantidad: 1,
                subtotal: precio_unitario,
            };
        }));
    };

    const handleItemQtyChange = (index, value) => {
        const cantidad = Math.max(1, Number(value) || 1);
        setEditItems((prev) => prev.map((row, i) => {
            if (i !== index) return row;
            return {
                ...row,
                cantidad,
                subtotal: cantidad * (Number(row.precio_unitario) || 0),
            };
        }));
    };

    const handleSaveItems = async () => {
        if (!activeSale || !isTauri()) return;
        if (editItems.length === 0) {
            toast.error(t('reports_items_min_one'));
            return;
        }

        try {
            setIsSavingItems(true);
            const deletedIds = new Set(deletedItemIds);

            for (const item of editItems) {
                const payload = {
                    id_producto_vendido: item.id_producto_vendido,
                    id_venta: activeSale.id_venta,
                    id_producto: item.id_producto,
                    nombre_producto_snapshot: item.nombre_producto_snapshot,
                    cantidad: item.cantidad,
                    precio_unitario: item.precio_unitario,
                    subtotal: item.subtotal,
                };

                if (item.id_producto_vendido) {
                    if (item.original_id_producto && item.id_producto !== item.original_id_producto) {
                        await invoke('delete_producto_vendido', { id: item.id_producto_vendido });
                        await invoke('create_producto_vendido', {
                            idVenta: activeSale.id_venta,
                            idProducto: item.id_producto,
                            nombreProductoSnapshot: item.nombre_producto_snapshot,
                            cantidad: item.cantidad,
                            precioUnitario: item.precio_unitario,
                            subtotal: item.subtotal,
                        });
                    } else {
                        await invoke('update_producto_vendido', { productoVendido: payload });
                    }
                } else {
                    await invoke('create_producto_vendido', {
                        idVenta: activeSale.id_venta,
                        idProducto: item.id_producto,
                        nombreProductoSnapshot: item.nombre_producto_snapshot,
                        cantidad: item.cantidad,
                        precioUnitario: item.precio_unitario,
                        subtotal: item.subtotal,
                    });
                }
            }

            for (const id of deletedIds) {
                await invoke('delete_producto_vendido', { id });
            }

            const newTotal = editItems.reduce((sum, item) => sum + Number(item.subtotal || 0), 0);
            await invoke('update_venta', {
                venta: {
                    id_venta: activeSale.id_venta,
                    fecha: activeSale.fecha,
                    nombre_clienta: activeSale.nombre_clienta,
                    apellido_clienta: activeSale.apellido_clienta ?? '',
                    total_venta: newTotal,
                    tipo_pago: activeSale.tipo_pago,
                },
            });

            await loadReportsData();
            toast.success(t('toast_sale_items_saved'));
            handleCloseItemsEdit();
        } catch (error) {
            console.error('Error updating sale items:', error);
            toast.error(t('toast_sale_items_error'));
        } finally {
            setIsSavingItems(false);
        }
    };

    const handleRegistrarAbonoDesdeModal = async () => {
        if (!activeSale || !isTauri()) return;

        const monto = Number(nuevoAbonoEdit);
        if (!Number.isFinite(monto) || monto <= 0) {
            toast.error(t('reports_abono_invalid_amount'));
            return;
        }

        try {
            setIsSavingEditAbono(true);
            await invoke('registrar_abono_venta', {
                input: {
                    id_venta: activeSale.id_venta,
                    monto_abono: monto,
                    fecha_abono: null,
                    metodo_registro: 'reportes-modal-edicion',
                    observacion: '',
                },
            });

            const [summary, abonos] = await Promise.all([
                invoke('get_cobranza_summary', { idVenta: activeSale.id_venta }),
                fetchAbonosBySale(activeSale.id_venta),
            ]);

            const normalizedSummary = {
                total_abonado: Number(summary?.total_abonado || 0),
                saldo_pendiente: Number(summary?.saldo_pendiente || 0),
                estado_pago: summary?.estado_pago || 'Pendiente',
            };

            setSales((prev) => prev.map((sale) => (
                sale.id_venta === activeSale.id_venta
                    ? { ...sale, ...normalizedSummary }
                    : sale
            )));

            setActiveSale((prev) => (prev ? { ...prev, ...normalizedSummary } : prev));
            setEditAbonos(abonos);
            setNuevoAbonoEdit('');
            toast.success(t('reports_abono_add_success'));
        } catch (error) {
            console.error('Error registering payment from edit modal:', error);
            toast.error(t('reports_abono_add_error'));
        } finally {
            setIsSavingEditAbono(false);
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

    const modalIsAbono = editForm.tipo_pago === 'Abono';
    const modalTotalVenta = Number(activeSale?.total_venta ?? editForm.total_venta ?? 0);
    const modalTotalAbonado = modalIsAbono
        ? Number(activeSale?.total_abonado ?? 0)
        : modalTotalVenta;
    const modalSaldoPendiente = modalIsAbono
        ? Math.max(0, Number(activeSale?.saldo_pendiente ?? (modalTotalVenta - modalTotalAbonado)))
        : 0;
    const modalEstadoPago = modalIsAbono
        ? (activeSale?.estado_pago || (modalSaldoPendiente <= 0 ? 'Liquidada' : 'Pendiente'))
        : 'Liquidada';
    const modalEstadoClass =
        modalEstadoPago === 'Liquidada'
            ? 'estado-liquidada'
            : modalEstadoPago === 'Parcial'
                ? 'estado-parcial'
                : 'estado-pendiente';

    return (
        <div className={`min-h-screen flex ${isDark ? 'reports-dark' : ''}`}>
            <Sidebar
                onNavigate={onNavigate}
                activePage={currentPage}
                isCollapsed={isSidebarCollapsed}
                toggleSidebar={toggleSidebar}
                profile={profile}
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
                                        <th>{t('reports_col_status')}</th>
                                        <th>{t('reports_col_pending')}</th>
                                        <th className="col-total">{t('reports_col_total')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pagedSales.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} className="reports-empty">{t('reports_no_sales')}</td>
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
                                                    onEditSale={handleOpenEditSale}
                                                    onDeleteSale={handleOpenDeleteSale}
                                                    onEditItems={handleOpenItemsEdit}
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
                                        <CaretLeft size={16} weight="duotone" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPageIndex((prev) => Math.min(totalPages, prev + 1))}
                                        disabled={safePageIndex === totalPages}
                                    >
                                        <CaretRight size={16} weight="duotone" />
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
                                onClick={handleExportXLSX}
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
                                onClick={handleBackupDB}
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

                {isEditModalOpen && (
                    <div className="reports-modal-overlay" onClick={handleCloseEditSale}>
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
                                                onClick={handleRegistrarAbonoDesdeModal}
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
                                <button type="button" className="reports-modal-button reports-modal-secondary" onClick={handleCloseEditSale}>
                                    {t('reports_edit_cancel')}
                                </button>
                                <button
                                    type="button"
                                    className="reports-modal-button reports-modal-primary"
                                    onClick={handleSaveSale}
                                    disabled={isUpdatingSale}
                                >
                                    {isUpdatingSale ? '...' : t('reports_edit_save')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {isDeleteModalOpen && (
                    <div className="reports-modal-overlay" onClick={handleCloseDeleteSale}>
                        <div className="reports-modal reports-modal-compact" onClick={(event) => event.stopPropagation()}>
                            <div className="reports-modal-header">
                                <h3>{t('reports_delete_title')}</h3>
                                <p>{t('reports_delete_desc')}</p>
                            </div>
                            <div className="reports-modal-body">
                                <p className="reports-modal-text">{t('reports_delete_warning')}</p>
                            </div>
                            <div className="reports-modal-actions">
                                <button type="button" className="reports-modal-button reports-modal-secondary" onClick={handleCloseDeleteSale}>
                                    {t('reports_delete_cancel')}
                                </button>
                                <button
                                    type="button"
                                    className="reports-modal-button reports-modal-danger"
                                    onClick={handleConfirmDeleteSale}
                                    disabled={isDeletingSale}
                                >
                                    {isDeletingSale ? '...' : t('reports_delete_confirm')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {isItemsModalOpen && (
                    <div className="reports-modal-overlay" onClick={handleCloseItemsEdit}>
                        <div className="reports-modal reports-modal-wide" onClick={(event) => event.stopPropagation()}>
                            <div className="reports-modal-header">
                                <h3>{t('reports_items_title')}</h3>
                                <p>{t('reports_items_desc')}</p>
                            </div>
                            <div className="reports-items-list">
                                {editItems.length === 0 ? (
                                    <p className="reports-modal-text">{t('reports_items_empty')}</p>
                                ) : (
                                    editItems.map((item, index) => (
                                        <div
                                            key={item.id_producto_vendido ?? item.temp_id ?? index}
                                            className="reports-items-row"
                                        >
                                            <select
                                                value={item.id_producto ?? ''}
                                                onChange={(event) => handleItemProductChange(index, event.target.value)}
                                            >
                                                {!productsById.has(item.id_producto) && item.id_producto && (
                                                    <option value={item.id_producto}>
                                                        {item.nombre_producto_snapshot || `ID ${item.id_producto}`}
                                                    </option>
                                                )}
                                                {products
                                                    .filter((p) => p.id_producto === item.id_producto || !usedProductIds.has(p.id_producto))
                                                    .map((product) => (
                                                        <option key={product.id_producto} value={product.id_producto}>
                                                            {product.nombre_producto}
                                                        </option>
                                                    ))}
                                            </select>
                                            <select
                                                value={item.cantidad}
                                                onChange={(event) => handleItemQtyChange(index, event.target.value)}
                                            >
                                                {(() => {
                                                    const prod = productsById.get(item.id_producto);
                                                    const currentStock = prod?.stock ?? 0;
                                                    const sameProduct = item.id_producto === item.original_id_producto;
                                                    const alreadySold = (item.id_producto_vendido && sameProduct) ? (item.original_cantidad ?? 0) : 0;
                                                    const maxQty = Math.max(1, currentStock + alreadySold);
                                                    return Array.from({ length: maxQty }, (_, i) => i + 1).map((n) => (
                                                        <option key={n} value={n}>{n}</option>
                                                    ));
                                                })()}
                                            </select>
                                            <div className="reports-items-price">{formatMoney(item.precio_unitario)}</div>
                                            <div className="reports-items-subtotal">{formatMoney(item.subtotal)}</div>
                                            <button
                                                type="button"
                                                className="reports-items-remove"
                                                onClick={() => handleRemoveItem(item)}
                                            >
                                                {t('reports_items_remove')}
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                            <div className="reports-items-footer">
                                <button
                                    type="button"
                                    className="reports-items-add"
                                    onClick={handleAddItem}
                                    disabled={products.filter((p) => !usedProductIds.has(p.id_producto)).length === 0}
                                >
                                    + {t('reports_items_add')}
                                </button>
                                <div className="reports-items-total">
                                    <span>{t('reports_items_total')}</span>
                                    <strong>
                                        {formatMoney(editItems.reduce((sum, item) => sum + Number(item.subtotal || 0), 0))}
                                    </strong>
                                </div>
                            </div>
                            <div className="reports-modal-actions">
                                <button type="button" className="reports-modal-button reports-modal-secondary" onClick={handleCloseItemsEdit}>
                                    {t('reports_items_cancel')}
                                </button>
                                <button
                                    type="button"
                                    className="reports-modal-button reports-modal-primary"
                                    onClick={handleSaveItems}
                                    disabled={isSavingItems}
                                >
                                    {isSavingItems ? '...' : t('reports_items_save')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

function SaleRow({ venta, saleProducts, isExpanded, onToggle, onEditSale, onDeleteSale, onEditItems, formatDate, formatMoney, t }) {
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
