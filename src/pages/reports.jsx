import { useContext, useEffect, useMemo, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { invoke, isTauri } from '@tauri-apps/api/core';
import Sidebar from '../components/sidebar';
import { ThemeContext } from '../context/ThemeContext';
import '../styles/reports.css';

export default function Reports({ onNavigate, currentPage, isSidebarCollapsed, toggleSidebar }) {
    const { getActiveTheme } = useContext(ThemeContext);
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
                toast.error('No se pudieron cargar los reportes');
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
        return date.toLocaleDateString('es-ES');
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
                        <h1>Reportes</h1>
                        <p>Ventas realizadas y detalle de productos vendidos.</p>
                    </div>
                    <div className="reports-summary">
                        <div className="reports-chip">
                            <span className="chip-label">Ventas</span>
                            <span className="chip-value">{totalItems}</span>
                        </div>
                        <div className="reports-chip">
                            <span className="chip-label">Productos vendidos</span>
                            <span className="chip-value">{totalProductos}</span>
                        </div>
                    </div>
                </header>

                <section className="reports-section">
                    <div className="reports-card reports-card-full">
                        <div className="reports-card-header">
                            <h2>Detalle de ventas</h2>
                            <div className="reports-expand-controls">
                                <button type="button" className="reports-expand-btn" onClick={expandAll} title="Expandir todas">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="7 13 12 18 17 13" />
                                        <polyline points="7 6 12 11 17 6" />
                                    </svg>
                                    Expandir
                                </button>
                                <button type="button" className="reports-expand-btn" onClick={collapseAll} title="Colapsar todas">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="17 11 12 6 7 11" />
                                        <polyline points="17 18 12 13 7 18" />
                                    </svg>
                                    Colapsar
                                </button>
                            </div>
                        </div>

                        <div className="reports-table-wrapper">
                            <table className="reports-table reports-unified">
                                <thead>
                                    <tr>
                                        <th className="col-expand"></th>
                                        <th>Venta</th>
                                        <th>Fecha</th>
                                        <th>Cliente</th>
                                        <th>Productos</th>
                                        <th>Tipo de pago</th>
                                        <th className="col-total">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pagedSales.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="reports-empty">No hay ventas registradas.</td>
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
                                    ? '0 - 0 de 0'
                                    : `${startIndex + 1} - ${endIndex} de ${totalItems}`}
                            </span>
                            <div className="reports-pagination-controls">
                                <label className="reports-items-per-page">
                                    <span>Mostrar</span>
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
            </main>
        </div>
    );
}

function SaleRow({ venta, saleProducts, isExpanded, onToggle, formatDate, formatMoney }) {
    const saleId = venta.id_venta;

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
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 18 15 12 9 6" />
                        </svg>
                    </span>
                </td>
                <td>
                    <span className="reports-id-badge" title={`ID: ${saleId}`}>
                        Venta #{saleId}
                    </span>
                </td>
                <td>{formatDate(venta.fecha)}</td>
                <td>{venta.nombre_clienta}</td>
                <td>
                    <span className="reports-product-count">
                        {saleProducts.length} {saleProducts.length === 1 ? 'producto' : 'productos'}
                    </span>
                </td>
                <td>{venta.tipo_pago}</td>
                <td className="col-total">{formatMoney(venta.total_venta)}</td>
            </tr>

            {isExpanded && (
                <tr className="reports-detail-row">
                    <td colSpan={7}>
                        <div className="reports-detail-container">
                            <table className="reports-detail-table">
                                <thead>
                                    <tr>
                                        <th>Producto</th>
                                        <th>Cantidad</th>
                                        <th>Precio unitario</th>
                                        <th>Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {saleProducts.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="reports-empty">Sin productos registrados.</td>
                                        </tr>
                                    ) : (
                                        saleProducts.map((item) => {
                                            const name = item.nombre_producto_snapshot || `ID ${item.id_producto}`;
                                            return (
                                                <tr key={item.id_producto_vendido ?? `${item.id_venta}-${item.id_producto}`}>
                                                    <td>{name}</td>
                                                    <td>{item.cantidad}</td>
                                                    <td>{formatMoney(item.precio_unitario)}</td>
                                                    <td>{formatMoney(item.subtotal)}</td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
}
