import Sidebar from '../components/sidebar';
import Header from '../components/header';
import { useContext, useState, useMemo, useEffect } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import { invoke, isTauri, convertFileSrc} from '@tauri-apps/api/core';
import '../styles/dashboard.css';

export default function Dashboard({ onNavigate, currentPage, isSidebarCollapsed, toggleSidebar }) {
  const { getActiveTheme } = useContext(ThemeContext);
  const isDark = getActiveTheme() === 'oscuro';
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [salesToday, setSalesToday] = useState(0);
  const [salesMonth, setSalesMonth] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [pageIndex, setPageIndex] = useState(1);

  // Carga de datos desde el backend para productos y categorías
  useEffect(() => {
    const loadData = async () => {
      if(!isTauri()) return;
      const[productsData, categoriesData, salesTodayData, salesMonthData] = await Promise.all
      ([
        invoke('list_productos'),
        invoke('list_categorias'),
        invoke('get_sales_today'),
        invoke('get_sales_month')
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
      setSalesToday(salesTodayData);
      setSalesMonth(salesMonthData);
    };
    loadData();
  }, []);

  //mapeo de categorias para convertir su id a nombre en la tabla de productos
  const categoryMap = useMemo(() => {
    const map = new Map();
    categories.forEach((cat) => {
      map.set(cat.id_categoria, cat.nombre);
    });
    return map;
  }, [categories]);

  const totalItems = products.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const safePageIndex = Math.min(pageIndex, totalPages);
  const startIndex = (safePageIndex - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const pagedProducts = useMemo(
    () => products.slice(startIndex, endIndex),
    [products, startIndex, endIndex]
  );

  const totalStock = useMemo(
    () => products.reduce((sum, product) => sum + (Number(product.stock) || 0), 0),
    [products]
  );

  const lowStockLimit = 10;
  const lowStockCount = useMemo(
    () => products.filter((product) => Number(product.stock) <= lowStockLimit).length,
    [products, lowStockLimit]
  );

  const lowStockProducts = useMemo(
    () => 
      products
    .filter((product) => Number(product.stock) <= lowStockLimit)
    .slice(0, 4),
    [products, lowStockLimit]
  );

  useEffect(() => {
    if (pageIndex !== safePageIndex) {
      setPageIndex(safePageIndex);
    }
  }, [pageIndex, safePageIndex]);

  // Datos de ejemplo
  const metrics = [
    { label: "Total Productos", value: totalStock, icon: "📦", color: "bg-rose-100 text-rose-700" },
    { label: "Productos con Stock Bajo", value: lowStockCount, icon: "⚠️", color: "bg-yellow-100 text-yellow-700" },
    { label: "Ventas Hoy", value: `$${salesToday.toFixed(2)}`, icon: "💵", color: "bg-green-100 text-green-700" },
    { label: "Ventas Mes", value: `$${salesMonth.toFixed(2)}`, icon: "📈", color: "bg-sky-100 text-sky-700" },
  ];

  const lowStock = [
    { img: "/assets/labial.jpg", name: "Labial Gel Semi-Mate - Red Roma", category: "Maquillaje", stock: 2 },
    { img: "/assets/crema.jpg", name: "Crema Renovadora de Noche", category: "Cuidado de la Piel", stock: 3 },
    { img: "/assets/delineador.jpg", name: "Delineador Líquido Black", category: "Maquillaje", stock: 3 },
    { img: "/assets/desmaquillante.jpg", name: "Desmaquillante de Ojos", category: "Cuidado de la Piel", stock: 1 },
  ];



  return (
    <div className={`min-h-screen flex ${isDark ? 'dashboard-dark' : ''}`}>
      {/* Sidebar */}
      <Sidebar onNavigate={onNavigate} activePage={currentPage} isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />

      {/* Main content */}
      <main className="dashboard-page">
        {/* Header */}
        <Header onNavigate={onNavigate} />

        {/* Métricas */}
        <div className="dashboard-metrics">
          {metrics.map((m, idx) => (
            <div key={m.label} className="dashboard-metric-card" data-metric-type={idx === 0 ? 'products' : idx === 1 ? 'lowstock' : idx === 2 ? 'sales-today' : 'sales-month'}>
              <span className="metric-icon">{m.icon}</span>
              <div className="metric-content">
                <div className="metric-value">{m.value}</div>
                <div className="metric-label">{m.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Contenido principal */}
        <div className="dashboard-layout">
          {/* Tabla productos */}
          <div className="dashboard-table-container">
            <h2 className="dashboard-section-title">Productos</h2>

            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Nombre del Producto</th>
                  <th>Categoría</th>
                  <th>Stock</th>
                  <th>Precio Por Unidad</th>
                </tr>
              </thead>
              <tbody>
                {pagedProducts.map((p) => {
                  const categoryName = categoryMap.get(p.id_categoria) || 'Sin Categoría';
                  const imageSrc = p.miniatura_base64
                    ? `data:image/jpeg;base64,${p.miniatura_base64}`
                    : p.ruta_imagen
                    ? convertFileSrc(p.ruta_imagen)
                    : null;
                  return (
                  <tr key={p.id_producto ?? p.nombre_producto}>
                    <td className="table-cell-product">
                      {imageSrc ? (
                        <img src={imageSrc} alt="" className="product-thumbnail" />
                      ) : (
                        <div className="product-thumbnail-placeholder" />
                      )}
                      <span>
                        <div className="product-name">{p.nombre_producto}</div>
                        <div className="product-category">{categoryName}</div>
                      </span>
                    </td>
                    <td>{categoryName}</td>
                    <td>{p.stock}</td>
                    <td>${p.precio}</td>
                  </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Paginación */}
            <div className="dashboard-pagination">
              <span>
                {totalItems === 0 ? '0 – 0 de 0' : `${startIndex + 1} – ${endIndex} de ${totalItems}`}
              </span>
              <div className="pagination-controls">
                <label className="items-per-page">
                  <span>Mostrar</span>
                  <select
                    value={itemsPerPage}
                    onChange={(event) => {
                      setItemsPerPage(Number(event.target.value));
                      setPageIndex(1);
                    }}
                  >
                    {[10, 20, 30].map((size) => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </label>
                <span className="pagination-buttons">
                  <button
                    onClick={() => setPageIndex((prev) => Math.max(1, prev - 1))}
                    disabled={safePageIndex === 1}
                  >
                    {"<"}
                  </button>
                  <button
                    onClick={() => setPageIndex((prev) => Math.min(totalPages, prev + 1))}
                    disabled={safePageIndex === totalPages}
                  >
                    {">"}
                  </button>
                </span>
              </div>
            </div>
          </div>

          {/* Panel derecho */}
          <div className="dashboard-sidebar">
            {/* Productos con stock bajo */}
            <div className="dashboard-card">
              <h2 className="dashboard-card-title">Productos con Stock Bajo</h2>
              <ul className="low-stock-list">
                {lowStockProducts.map((item) => {
                  const categoryName = categoryMap.get(item.id_categoria) || 'Sin Categoría';
                  return (
                    <li key={item.id_producto ?? item.nombre_producto} className="low-stock-item">
                      <div className='low-stock-info'>
                        <div className='low-stock-name'>{item.nombre_producto}</div>
                        <div className='low-stock-category'>{categoryName}</div>
                      </div>
                      <span className='low-stock-quantity'>{item.stock}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
            {/* Gráfica de ventas (placeholder) */}
            <div className="dashboard-card">
              <h2 className="dashboard-card-title">Ventas de la Semana</h2>
              <div className="sales-chart">
                {/* Simulación de barras */}
                {[60, 80, 100, 70, 90, 110, 95].map((h, i) => (
                  <div key={i} className="chart-bar" style={{ height: `${h / 1.5}px` }} />
                ))}
              </div>
              <div className="chart-labels">
                <span>Lun</span><span>Mar</span><span>Mié</span><span>Jue</span><span>Vie</span><span>Sáb</span><span>Dom</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}