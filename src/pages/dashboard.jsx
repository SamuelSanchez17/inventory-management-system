import Sidebar from '../components/sidebar';
import Header from '../components/header';
import { useContext, useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import { ThemeContext } from '../context/ThemeContext';
import { LanguageContext } from '../context/LanguageContext';
import { invoke, isTauri } from '@tauri-apps/api/core';
import { CurrencyDollar, Package, TrendUp, Warning } from 'phosphor-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import '../styles/dashboard.css';

export default function Dashboard({ onNavigate, currentPage, isSidebarCollapsed, toggleSidebar, profile }) {
  const { getActiveTheme } = useContext(ThemeContext);
  const { t } = useContext(LanguageContext);
  const isDark = getActiveTheme() === 'oscuro';

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [salesToday, setSalesToday] = useState(0);
  const [salesMonth, setSalesMonth] = useState(0);
  const [topProductos, setTopProductos] = useState([]);
  const [lowStockPage, setLowStockPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  // Carga de datos desde el backend
  useEffect(() => {
    const loadData = async () => {
      if (!isTauri()) return;
      const [productsData, categoriesData, salesTodayData, salesMonthData, topProductosData] = await Promise.all([
        invoke('list_productos'),
        invoke('list_categorias'),
        invoke('get_sales_today'),
        invoke('get_sales_month'),
        invoke('get_top_productos')
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
      setSalesToday(salesTodayData);
      setSalesMonth(salesMonthData);
      setTopProductos(topProductosData);
    };
    loadData();
  }, []);

  // Mapeo de categorías
  const categoryMap = useMemo(() => {
    const map = new Map();
    categories.forEach((cat) => {
      map.set(cat.id_categoria, cat.nombre);
    });
    return map;
  }, [categories]);

  // Métricas
  const totalStock = useMemo(
    () => products.reduce((sum, product) => sum + (Number(product.stock) || 0), 0),
    [products]
  );

  const lowStockLimit = 10;
  const lowStockCount = useMemo(
    () => products.filter((product) => Number(product.stock) <= lowStockLimit).length,
    [products, lowStockLimit]
  );

  const lowStockPageSize = 4;
  const lowStockItems = useMemo(
    () => products.filter((product) => Number(product.stock) <= lowStockLimit),
    [products, lowStockLimit]
  );
  const lowStockTotalPages = Math.max(1, Math.ceil(lowStockItems.length / lowStockPageSize));
  const safeLowStockPage = Math.min(lowStockPage, lowStockTotalPages);
  const lowStockStart = (safeLowStockPage - 1) * lowStockPageSize;
  const lowStockProducts = useMemo(
    () => lowStockItems.slice(lowStockStart, lowStockStart + lowStockPageSize),
    [lowStockItems, lowStockStart, lowStockPageSize]
  );

  useEffect(() => {
    if (lowStockPage !== safeLowStockPage) {
      setLowStockPage(safeLowStockPage);
    }
  }, [lowStockPage, safeLowStockPage]);

  const metrics = [
    {
      label: t('dashboard_metric_total'),
      value: totalStock,
      icon: <Package size={28} weight="duotone" />,
      color: "bg-rose-100 text-rose-700",
    },
    {
      label: t('dashboard_metric_low_stock'),
      value: lowStockCount,
      icon: <Warning size={28} weight="duotone" />,
      color: "bg-yellow-100 text-yellow-700",
    },
    {
      label: t('dashboard_metric_sales_today'),
      value: `$${salesToday.toFixed(2)}`,
      icon: <CurrencyDollar size={28} weight="duotone" />,
      color: "bg-green-100 text-green-700",
    },
    {
      label: t('dashboard_metric_sales_month'),
      value: `$${salesMonth.toFixed(2)}`,
      icon: <TrendUp size={28} weight="duotone" />,
      color: "bg-sky-100 text-sky-700",
    },
  ];

  return (
    <div className={`min-h-screen flex ${isDark ? 'dashboard-dark' : ''}`}>
      <Sidebar onNavigate={onNavigate} activePage={currentPage} isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} profile={profile} />

      <main className="dashboard-page">
        <Header
          onNavigate={onNavigate}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />

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

        {/* Contenido principal - dos columnas iguales */}
        <div className="dashboard-grid">
          {/* Productos con stock bajo */}
          <div className="dashboard-card">
            <h2 className="dashboard-card-title">{t('dashboard_low_stock_title')}</h2>
            {lowStockItems.length === 0 ? (
              <div className="top5-empty">
                <p>{t('dashboard_low_stock_empty')}</p>
              </div>
            ) : (
              <>
                <ul className="low-stock-list">
                  {lowStockProducts.map((item) => {
                    const categoryName = categoryMap.get(item.id_categoria) || t('dashboard_no_category');
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
                {lowStockItems.length > lowStockPageSize && (
                  <div className="low-stock-pagination">
                    <span>
                      {lowStockStart + 1} – {Math.min(lowStockStart + lowStockPageSize, lowStockItems.length)} {t('dashboard_of')} {lowStockItems.length}
                    </span>
                    <div className="low-stock-pagination-buttons">
                      <button
                        type="button"
                        onClick={() => setLowStockPage((prev) => Math.max(1, prev - 1))}
                        disabled={safeLowStockPage === 1}
                      >
                        {"<"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setLowStockPage((prev) => Math.min(lowStockTotalPages, prev + 1))}
                        disabled={safeLowStockPage === lowStockTotalPages}
                      >
                        {">"}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Top 5 Productos Más Vendidos */}
          <div className="dashboard-card dashboard-card-chart">
            <h2 className="dashboard-card-title">{t('dashboard_top5_title')}</h2>
            {topProductos.length === 0 ? (
              <div className="top5-empty">
                <p>{t('dashboard_top5_empty')}</p>
              </div>
            ) : (
              <div className="top5-chart-wrapper">
                <ResponsiveContainer width="100%" height={topProductos.length * 64 + 40}>
                  <BarChart
                    data={topProductos.map(p => ({
                      nombre: p.nombre.length > 22 ? p.nombre.slice(0, 22) + '\u2026' : p.nombre,
                      nombreCompleto: p.nombre,
                      unidades: p.unidades,
                      ingreso: Number(p.ingreso.toFixed(2)),
                    }))}
                    layout="vertical"
                    margin={{ top: 4, right: 24, left: 8, bottom: 4 }}
                    barCategoryGap="20%"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(148,163,184,0.12)' : '#e2e8f0'} horizontal={false} />
                    <XAxis
                      type="number"
                      tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `$${v}`}
                    />
                    <YAxis
                      type="category"
                      dataKey="nombre"
                      width={160}
                      tick={{ fill: isDark ? '#cbd5e1' : '#334155', fontSize: 13, fontWeight: 500 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: isDark ? '#1e293b' : '#ffffff',
                        border: `1px solid ${isDark ? 'rgba(148,163,184,0.25)' : '#e2e8f0'}`,
                        borderRadius: 12,
                        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                        color: isDark ? '#f1f5f9' : '#1e293b',
                        fontSize: 13,
                        padding: '10px 14px',
                      }}
                      cursor={{ fill: isDark ? 'rgba(56,189,248,0.06)' : 'rgba(15,76,129,0.04)' }}
                      formatter={(value, name) => {
                        if (name === 'ingreso') return [`$${value.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, t('dashboard_top5_revenue')];
                        return [value, t('dashboard_top5_units')];
                      }}
                      labelFormatter={(label, payload) => {
                        const item = payload?.[0]?.payload;
                        return item?.nombreCompleto || label;
                      }}
                    />
                    <Bar dataKey="ingreso" radius={[0, 8, 8, 0]} maxBarSize={28}>
                      {topProductos.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={isDark
                            ? ['#38bdf8', '#22d3ee', '#34d399', '#a78bfa', '#fb923c'][index]
                            : ['#0f4c81', '#0891b2', '#059669', '#7c3aed', '#ea580c'][index]
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
