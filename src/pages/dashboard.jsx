import Sidebar from '../components/sidebar';
import Header from '../components/header';
import { useContext, useState, useMemo, useEffect } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import { invoke, isTauri, convertFileSrc} from '@tauri-apps/api/core';

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
    <div className={`min-h-screen flex ${isDark ? 'bg-gray-900' : 'bg-rose-50'}`}>
      {/* Sidebar */}
      <Sidebar onNavigate={onNavigate} activePage={currentPage} isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />

      {/* Main content */}
      <main className={`flex-1 p-10 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
        {/* Header */}
        <Header onNavigate={onNavigate} />

        {/* Métricas */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          {metrics.map((m) => (
            <div key={m.label} className={`rounded-xl p-5 flex items-center gap-4 shadow ${m.color}`}>
              <span className="text-3xl">{m.icon}</span>
              <div>
                <div className="text-2xl font-bold">{m.value}</div>
                <div className="text-sm">{m.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Contenido principal */}
        <div className="grid grid-cols-3 gap-8">
          {/* Tabla productos */}
          <div className="col-span-2 bg-white rounded-xl shadow p-6">
            <div className="mb-4 font-semibold text-rose-800">Productos</div>

            <table className="w-full text-left">
              <thead>
                <tr className="text-rose-400 text-xs uppercase border-b">
                  <th className="py-2">Nombre del Producto</th>
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
                  <tr key={p.id_producto ?? p.nombre_producto} className="last:border-b-0 hover:bg-rose-50">
                    <td className="py-2 flex items-center gap-3">
                      {imageSrc ? (
                        <img src={imageSrc} alt="" className="w-10 h-10 rounded-lg object-cover border border-rose-100" />
                      ) : (
                        <div className="" />
                      )}
                      <span>
                        <div className="font-semibold">{p.nombre_producto}</div>
                        <div className="text-xs text-rose-400">{categoryName}</div>
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
            <div className="mt-4 text-xs text-rose-400 flex flex-wrap items-center justify-between gap-3">
              <span>
                {totalItems === 0 ? '0 – 0 de 0' : `${startIndex + 1} – ${endIndex} de ${totalItems}`}
              </span>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2">
                  <span>Mostrar</span>
                  <select
                    className="rounded bg-rose-100 text-rose-600 px-2 py-1"
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
                <span className="space-x-2">
                  <button
                    className="px-2 py-1 rounded bg-rose-100 text-rose-400 disabled:opacity-50"
                    onClick={() => setPageIndex((prev) => Math.max(1, prev - 1))}
                    disabled={safePageIndex === 1}
                  >
                    {"<"}
                  </button>
                  <button
                    className="px-2 py-1 rounded bg-rose-100 text-rose-400 disabled:opacity-50"
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
          <div className="flex flex-col gap-6">
            {/* Productos con stock bajo */}
            <div className="bg-white rounded-xl shadow p-4">
              <div className="font-semibold text-rose-800 mb-2">Productos con Stock Bajo</div>
              <ul>
                {lowStockProducts.map((item) => {
                  const categoryName = categoryMap.get(item.id_categoria) || 'Sin Categoría';
                  return (
                    <li key={item.id_producto ?? item.nombre_producto} className="flex items-center gap-3 py-2 last:border-b-0">
                      <div className='flex-1'>
                        <div className='text-sm'>{item.nombre_producto}</div>
                        <div className='text-xs text-rose-400'>{categoryName}</div>
                      </div>
                      <span className='text-rose-600 font-bold'>{item.stock}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
            {/* Gráfica de ventas (placeholder) */}
            <div className="bg-white rounded-xl shadow p-4">
              <div className="font-semibold text-rose-800 mb-2">Ventas de la Semana</div>
              <div className="h-24 flex items-end gap-2">
                {/* Simulación de barras */}
                {[60, 80, 100, 70, 90, 110, 95].map((h, i) => (
                  <div key={i} className="w-6 rounded bg-rose-200" style={{ height: `${h / 1.5}px` }} />
                ))}
              </div>
              <div className="flex justify-between text-xs text-rose-400 mt-2">
                <span>Lun</span><span>Mar</span><span>Mié</span><span>Jue</span><span>Vie</span><span>Sáb</span><span>Dom</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}