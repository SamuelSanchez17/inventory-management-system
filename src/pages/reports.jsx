import { useContext, useEffect, useMemo, useState } from 'react';
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
    const [products, setProducts] = useState([]);
    const [salesItemsPerPage, setSalesItemsPerPage] = useState(8);
    const [salesPageIndex, setSalesPageIndex] = useState(1);
    const [soldItemsPerPage, setSoldItemsPerPage] = useState(8);
    const [soldPageIndex, setSoldPageIndex] = useState(1);

    useEffect(() => {
        const loadReportsData = async () => {
            if (!isTauri()) {
                return;
            }

            try {
                const [salesData, soldData, productsData] = await Promise.all([
                    invoke('list_ventas'),
                    invoke('list_productos_vendidos'),
                    invoke('list_productos'),
                ]);

                setSales(Array.isArray(salesData) ? salesData : []);
                setSoldProducts(Array.isArray(soldData) ? soldData : []);
                setProducts(Array.isArray(productsData) ? productsData : []);
            } catch (error) {
                console.error('Error al cargar reportes:', error);
                toast.error('No se pudieron cargar los reportes');
            }
        };

        loadReportsData();
    }, []);

    const productNameById = useMemo(() => {
        const map = new Map();
        products.forEach((product) => {
            map.set(product.id_producto, product.nombre_producto);
        });
        return map;
    }, [products]);

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

    const salesTotalItems = sales.length;
    const salesTotalPages = Math.max(1, Math.ceil(salesTotalItems / salesItemsPerPage));
    const salesSafePageIndex = Math.min(salesPageIndex, salesTotalPages);
    const salesStartIndex = (salesSafePageIndex - 1) * salesItemsPerPage;
    const salesEndIndex = Math.min(salesStartIndex + salesItemsPerPage, salesTotalItems);
    const pagedSales = useMemo(
        () => sales.slice(salesStartIndex, salesEndIndex),
        [sales, salesStartIndex, salesEndIndex]
    );

    const soldTotalItems = soldProducts.length;
    const soldTotalPages = Math.max(1, Math.ceil(soldTotalItems / soldItemsPerPage));
    const soldSafePageIndex = Math.min(soldPageIndex, soldTotalPages);
    const soldStartIndex = (soldSafePageIndex - 1) * soldItemsPerPage;
    const soldEndIndex = Math.min(soldStartIndex + soldItemsPerPage, soldTotalItems);
    const pagedSoldProducts = useMemo(
        () => soldProducts.slice(soldStartIndex, soldEndIndex),
        [soldProducts, soldStartIndex, soldEndIndex]
    );

    useEffect(() => {
        if (salesPageIndex !== salesSafePageIndex) {
            setSalesPageIndex(salesSafePageIndex);
        }
    }, [salesPageIndex, salesSafePageIndex]);

    useEffect(() => {
        if (soldPageIndex !== soldSafePageIndex) {
            setSoldPageIndex(soldSafePageIndex);
        }
    }, [soldPageIndex, soldSafePageIndex]);

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
                            <span className="chip-value">{salesTotalItems}</span>
                        </div>
                        <div className="reports-chip">
                            <span className="chip-label">Productos</span>
                            <span className="chip-value">{soldTotalItems}</span>
                        </div>
                    </div>
                </header>

                <section className="reports-grid">
                    <div className="reports-card">
                        <div className="reports-card-header">
                            <h2>Ventas realizadas</h2>
                        </div>

                        <div className="reports-table-wrapper">
                            <table className="reports-table">
                                <thead>
                                    <tr>
                                        <th>Venta</th>
                                        <th>Fecha</th>
                                        <th>Cliente</th>
                                        <th>Total</th>
                                        <th>Pago</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pagedSales.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="reports-empty">No hay ventas registradas.</td>
                                        </tr>
                                    ) : (
                                        pagedSales.map((venta) => (
                                            <tr key={venta.id_venta ?? `${venta.fecha}-${venta.nombre_clienta}`}>
                                                <td>
                                                    <span
                                                        className="reports-id-badge"
                                                        title={`ID: ${venta.id_venta}`}
                                                    >
                                                        Venta #{venta.id_venta}
                                                    </span>
                                                </td>
                                                <td>{formatDate(venta.fecha)}</td>
                                                <td>{venta.nombre_clienta}</td>
                                                <td>{formatMoney(venta.total_venta)}</td>
                                                <td>{venta.tipo_pago}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="reports-pagination">
                            <span>
                                {salesTotalItems === 0
                                    ? '0 - 0 de 0'
                                    : `${salesStartIndex + 1} - ${salesEndIndex} de ${salesTotalItems}`}
                            </span>
                            <div className="reports-pagination-controls">
                                <label className="reports-items-per-page">
                                    <span>Mostrar</span>
                                    <select
                                        value={salesItemsPerPage}
                                        onChange={(event) => {
                                            setSalesItemsPerPage(Number(event.target.value));
                                            setSalesPageIndex(1);
                                        }}
                                    >
                                        {[8, 12, 16].map((size) => (
                                            <option key={size} value={size}>{size}</option>
                                        ))}
                                    </select>
                                </label>
                                <span className="reports-pagination-buttons">
                                    <button
                                        type="button"
                                        onClick={() => setSalesPageIndex((prev) => Math.max(1, prev - 1))}
                                        disabled={salesSafePageIndex === 1}
                                    >
                                        {'<'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSalesPageIndex((prev) => Math.min(salesTotalPages, prev + 1))}
                                        disabled={salesSafePageIndex === salesTotalPages}
                                    >
                                        {'>'}
                                    </button>
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="reports-card">
                        <div className="reports-card-header">
                            <h2>Productos vendidos</h2>
                        </div>

                        <div className="reports-table-wrapper">
                            <table className="reports-table">
                                <thead>
                                    <tr>
                                        <th>Venta</th>
                                        <th>Producto</th>
                                        <th>Cantidad</th>
                                        <th>Precio</th>
                                        <th>Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pagedSoldProducts.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="reports-empty">No hay productos vendidos.</td>
                                        </tr>
                                    ) : (
                                        pagedSoldProducts.map((item) => {
                                            const name = productNameById.get(item.id_producto) || `ID ${item.id_producto}`;
                                            return (
                                                <tr key={item.id_producto_vendido ?? `${item.id_venta}-${item.id_producto}`}>
                                                    <td>
                                                        <span
                                                            className="reports-id-badge"
                                                            title={`ID: ${item.id_venta}`}
                                                        >
                                                            Venta #{item.id_venta}
                                                        </span>
                                                    </td>
                                                    <td title={`Item: ${item.id_producto_vendido} · Producto: ${item.id_producto}`}>
                                                        {name}
                                                    </td>
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

                        <div className="reports-pagination">
                            <span>
                                {soldTotalItems === 0
                                    ? '0 - 0 de 0'
                                    : `${soldStartIndex + 1} - ${soldEndIndex} de ${soldTotalItems}`}
                            </span>
                            <div className="reports-pagination-controls">
                                <label className="reports-items-per-page">
                                    <span>Mostrar</span>
                                    <select
                                        value={soldItemsPerPage}
                                        onChange={(event) => {
                                            setSoldItemsPerPage(Number(event.target.value));
                                            setSoldPageIndex(1);
                                        }}
                                    >
                                        {[8, 12, 16].map((size) => (
                                            <option key={size} value={size}>{size}</option>
                                        ))}
                                    </select>
                                </label>
                                <span className="reports-pagination-buttons">
                                    <button
                                        type="button"
                                        onClick={() => setSoldPageIndex((prev) => Math.max(1, prev - 1))}
                                        disabled={soldSafePageIndex === 1}
                                    >
                                        {'<'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSoldPageIndex((prev) => Math.min(soldTotalPages, prev + 1))}
                                        disabled={soldSafePageIndex === soldTotalPages}
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
