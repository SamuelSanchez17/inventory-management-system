import Sidebar from '../components/sidebar';
import Header from '../components/header';
import { useContext, useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import { ThemeContext } from '../context/ThemeContext';
import { LanguageContext } from '../context/LanguageContext';
import { invoke, isTauri, convertFileSrc } from '@tauri-apps/api/core';
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
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [pageIndex, setPageIndex] = useState(1);
  const [lowStockPage, setLowStockPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    nombre_producto: '',
    id_categoria: '',
    stock: '',
    precio: ''
  });
  const [editImageFile, setEditImageFile] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState(null);
  const [editMiniaturaBase64, setEditMiniaturaBase64] = useState(null);

  // Carga de datos desde el backend para productos y categorías
  useEffect(() => {
    const loadData = async () => {
      if(!isTauri()) return;
      const [productsData, categoriesData, salesTodayData, salesMonthData, topProductosData] = await Promise.all
      ([
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

  //mapeo de categorias para convertir el id a nombre de categoria en la tabla de productos
  const categoryMap = useMemo(() => {
    const map = new Map();
    categories.forEach((cat) => {
      map.set(cat.id_categoria, cat.nombre);
    });
    return map;
  }, [categories]);

  //Funcion de busqueda que aplica normalizacion de texto aplicando el algoritmo de Levenshtein 
  const toSingular = (word) => {
    if (word.length <= 3) {
      return word;
    }

    if (word.endsWith('ces')) {
      return `${word.slice(0, -3)}z`;
    }

    if (word.endsWith('es')) {
      return word.slice(0, -2);
    }

    if (word.endsWith('s')) {
      return word.slice(0, -1);
    }

    return word;
  };

  const normalizeText = (text) => {
    if (!text) {
      return '';
    }

    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .map(toSingular)
      .join(' ');
  };

  const levenshteinDistance = (source, target) => {
    if (source === target) {
      return 0;
    }

    if (!source) {
      return target.length;
    }

    if (!target) {
      return source.length;
    }

    const sourceLength = source.length;
    const targetLength = target.length;
    let prev = Array.from({ length: targetLength + 1 }, (_, idx) => idx);

    for (let i = 1; i <= sourceLength; i += 1) {
      const current = [i];
      for (let j = 1; j <= targetLength; j += 1) {
        const cost = source[i - 1] === target[j - 1] ? 0 : 1;
        current[j] = Math.min(
          prev[j] + 1,
          current[j - 1] + 1,
          prev[j - 1] + cost
        );
      }
      prev = current;
    }

    return prev[targetLength];
  };

  const normalizedQuery = useMemo(() => normalizeText(searchTerm), [searchTerm]);

  const filteredProducts = useMemo(() => {
    if (!normalizedQuery) {
      return products;
    }

    const scored = products.map((product) => {
      const name = normalizeText(product.nombre_producto || '');
      const distance = name.includes(normalizedQuery)
        ? 0
        : levenshteinDistance(normalizedQuery, name);
      return { product, name, distance };
    });

    const threshold = Math.max(1, Math.floor(normalizedQuery.length * 0.4));
    const matches = scored.filter(
      (item) => item.name.includes(normalizedQuery) || item.distance <= threshold
    );

    const sorted = (matches.length ? matches : scored)
      .slice()
      .sort((a, b) => {
        if (a.distance !== b.distance) {
          return a.distance - b.distance;
        }
        return (a.product.nombre_producto || '').localeCompare(
          b.product.nombre_producto || ''
        );
      });

    const finalResults = matches.length ? sorted : sorted.slice(0, 3);
    return finalResults.map((item) => item.product);
  }, [products, normalizedQuery]);

  useEffect(() => {
    setPageIndex(1);
  }, [normalizedQuery]);

  const totalItems = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const safePageIndex = Math.min(pageIndex, totalPages);
  const startIndex = (safePageIndex - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const pagedProducts = useMemo(
    () => filteredProducts.slice(startIndex, endIndex),
    [filteredProducts, startIndex, endIndex]
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
    if (pageIndex !== safePageIndex) {
      setPageIndex(safePageIndex);
    }
  }, [pageIndex, safePageIndex]);

  useEffect(() => {
    if (lowStockPage !== safeLowStockPage) {
      setLowStockPage(safeLowStockPage);
    }
  }, [lowStockPage, safeLowStockPage]);

  const makeThumbnail = (file, maxSize = 200) =>
    new Promise((resolve, reject) => {
      const img = new window.Image();
      const reader = new FileReader();

      reader.onload = (event) => {
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const scale = Math.min(maxSize / img.width, maxSize / img.height);
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const base64 = canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
          resolve(base64);
        };
        img.onerror = reject;
        img.src = event.target.result;
      };

      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const openEditModal = (product) => {
    setSelectedProduct(product);
    setEditForm({
      nombre_producto: product.nombre_producto ?? '',
      id_categoria: product.id_categoria ?? '',
      stock: product.stock ?? '',
      precio: product.precio ?? ''
    });
    const initialPreview = product.miniatura_base64
      ? `data:image/jpeg;base64,${product.miniatura_base64}`
      : product.ruta_imagen
      ? convertFileSrc(product.ruta_imagen)
      : null;
    setEditImagePreview(initialPreview);
    setEditImageFile(null);
    setEditMiniaturaBase64(null);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedProduct(null);
    setEditImageFile(null);
    setEditImagePreview(null);
    setEditMiniaturaBase64(null);
  };

  const openDeleteModal = (product) => {
    setSelectedProduct(product);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedProduct(null);
  };

  const handleEditInputChange = (event) => {
    const { name, value } = event.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setEditImageFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      setEditImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);

    makeThumbnail(file)
      .then((base64) => setEditMiniaturaBase64(base64))
      .catch(() => setEditMiniaturaBase64(null));
  };

  const handleConfirmUpdate = async () => {
    if (!selectedProduct) {
      return;
    }

    const nombre_producto = editForm.nombre_producto.trim();
    if (!nombre_producto) {
      toast.error(t('toast_name_required'));
      return;
    }

    if (!isTauri()) {
      toast.error(t('toast_tauri_unavailable'));
      return;
    }

    const id_categoria = editForm.id_categoria === '' ? null : Number(editForm.id_categoria);
    const stock = Number(editForm.stock);
    const precio = Number(editForm.precio);

    const updatedProduct = {
      ...selectedProduct,
      nombre_producto,
      id_categoria,
      stock,
      precio,
      miniatura_base64: editMiniaturaBase64 ?? selectedProduct.miniatura_base64
    };

    let imageBytes = null;
    let imageExt = null;

    if (editImageFile) {
      const arrayBuffer = await editImageFile.arrayBuffer();
      imageBytes = Array.from(new Uint8Array(arrayBuffer));
      imageExt = editImageFile.name.split('.').pop();
    }

    try {
      await invoke('update_producto', {
        producto: updatedProduct,
        imageBytes: imageBytes,
        imageExt: imageExt,
        miniaturaBase64: editMiniaturaBase64
      });

      setProducts((prev) =>
        prev.map((product) =>
          product.id_producto === updatedProduct.id_producto ? updatedProduct : product
        )
      );
      closeEditModal();
      toast.success(t('toast_product_updated'));
    } catch (error) {
      console.error('Error al actualizar producto:', error);
      toast.error(t('toast_product_update_error'));
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedProduct) {
      return;
    }

    if (!isTauri()) {
      toast.error(t('toast_tauri_unavailable'));
      return;
    }

    try {
      await invoke('delete_producto', { id: selectedProduct.id_producto });
      setProducts((prev) =>
        prev.filter((product) => product.id_producto !== selectedProduct.id_producto)
      );
      closeDeleteModal();
      toast.success(t('toast_product_deleted'));
    } catch (error) {
      console.error('Error al eliminar producto:', error);
      toast.error(t('toast_product_delete_error'));
    }
  };

  //Métricas del dashboard
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
      {/* Sidebar */}
      <Sidebar onNavigate={onNavigate} activePage={currentPage} isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} profile={profile} />

      {/* Main content */}
      <main className="dashboard-page">
        {/* Header */}
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

        {/* Contenido principal */}
        <div className="dashboard-layout">
          {/* Tabla productos */}
          <div className="dashboard-table-container">
            <h2 className="dashboard-section-title">{t('dashboard_section_products')}</h2>

            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>{t('dashboard_col_name')}</th>
                  <th>{t('dashboard_col_category')}</th>
                  <th>{t('dashboard_col_stock')}</th>
                  <th>{t('dashboard_col_price')}</th>
                  <th>{t('dashboard_col_actions')}</th>
                </tr>
              </thead>
              <tbody>
                {pagedProducts.length === 0 ? (
                  <tr>
                    <td colSpan="5">
                      <div className="top5-empty">Aun no hay productos registrados.</div>
                    </td>
                  </tr>
                ) : (
                  pagedProducts.map((p) => {
                    const categoryName = categoryMap.get(p.id_categoria) || t('dashboard_no_category');
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
                          <div className="product-info">
                            <div className="product-name">{p.nombre_producto}</div>
                          </div>
                        </td>
                        <td className="table-cell-category" title={categoryName}>{categoryName}</td>
                        <td>{p.stock}</td>
                        <td>${p.precio}</td>
                        <td>
                          <div className="dashboard-table-actions">
                            <button
                              type="button"
                              className="dashboard-action-button dashboard-action-edit"
                              onClick={() => openEditModal(p)}
                            >
                              {t('dashboard_btn_edit')}
                            </button>
                            <button
                              type="button"
                              className="dashboard-action-button dashboard-action-delete"
                              onClick={() => openDeleteModal(p)}
                            >
                              {t('dashboard_btn_delete')}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            {/* Paginación */}
            <div className="dashboard-pagination">
              <span>
                {totalItems === 0 ? `0 – 0 ${t('dashboard_of')} 0` : `${startIndex + 1} – ${endIndex} ${t('dashboard_of')} ${totalItems}`}
              </span>
              <div className="pagination-controls">
                <label className="items-per-page">
                  <span>{t('dashboard_pagination_show')}</span>
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
              <h2 className="dashboard-card-title">{t('dashboard_low_stock_title')}</h2>
              {lowStockItems.length === 0 ? (
                <div className="top5-empty">
                  <p>Aun no hay productos con bajo stock.</p>
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
        </div>

        {isEditModalOpen && selectedProduct && (
          <div className="dashboard-modal-overlay" role="dialog" aria-modal="true">
            <div className="dashboard-modal">
              <div className="dashboard-modal-header">
                <h3>{t('dashboard_edit_title')}</h3>
                <p>{selectedProduct.nombre_producto}</p>
              </div>
              <div className="dashboard-modal-body">
                <div className="dashboard-image-field">
                  <div className="dashboard-image-preview">
                    {editImagePreview ? (
                      <img src={editImagePreview} alt="Vista previa" />
                    ) : (
                      <div className="dashboard-image-placeholder">{t('dashboard_edit_no_image')}</div>
                    )}
                  </div>
                  <label className="dashboard-image-upload">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleEditImageChange}
                    />
                    {editImagePreview ? t('dashboard_edit_change_image') : t('dashboard_edit_add_image')}
                  </label>
                </div>
                <label className="dashboard-modal-field">
                  <span>{t('dashboard_edit_name')}</span>
                  <input
                    name="nombre_producto"
                    value={editForm.nombre_producto}
                    onChange={handleEditInputChange}
                    type="text"
                  />
                </label>
                <label className="dashboard-modal-field">
                  <span>{t('dashboard_edit_category')}</span>
                  <select
                    name="id_categoria"
                    value={editForm.id_categoria}
                    onChange={handleEditInputChange}
                  >
                    <option value="">{t('dashboard_edit_no_category')}</option>
                    {categories.map((cat) => (
                      <option key={cat.id_categoria} value={cat.id_categoria}>
                        {cat.nombre}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="dashboard-modal-field">
                  <span>{t('dashboard_edit_stock')}</span>
                  <input
                    name="stock"
                    value={editForm.stock}
                    onChange={handleEditInputChange}
                    type="number"
                    min="0"
                  />
                </label>
                <label className="dashboard-modal-field">
                  <span>{t('dashboard_edit_price')}</span>
                  <input
                    name="precio"
                    value={editForm.precio}
                    onChange={handleEditInputChange}
                    type="number"
                    min="0"
                    step="0.01"
                  />
                </label>
              </div>
              <div className="dashboard-modal-actions">
                <button
                  type="button"
                  className="dashboard-modal-button dashboard-modal-secondary"
                  onClick={closeEditModal}
                >
                  {t('dashboard_edit_cancel')}
                </button>
                <button
                  type="button"
                  className="dashboard-modal-button dashboard-modal-primary"
                  onClick={handleConfirmUpdate}
                >
                  {t('dashboard_edit_save')}
                </button>
              </div>
            </div>
          </div>
        )}

        {isDeleteModalOpen && selectedProduct && (
          <div className="dashboard-modal-overlay" role="dialog" aria-modal="true">
            <div className="dashboard-modal dashboard-modal-compact">
              <div className="dashboard-modal-header">
                <h3>{t('dashboard_delete_title')}</h3>
                <p>{t('dashboard_delete_warning')}</p>
              </div>
              <div className="dashboard-modal-body">
                <p className="dashboard-modal-text">
                  {t('dashboard_delete_confirm')} <strong>{selectedProduct.nombre_producto}</strong>?
                </p>
              </div>
              <div className="dashboard-modal-actions">
                <button
                  type="button"
                  className="dashboard-modal-button dashboard-modal-secondary"
                  onClick={closeDeleteModal}
                >
                  {t('dashboard_delete_cancel')}
                </button>
                <button
                  type="button"
                  className="dashboard-modal-button dashboard-modal-danger"
                  onClick={handleConfirmDelete}
                >
                  {t('dashboard_delete_btn')}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}