import Sidebar from '../components/sidebar';
import Header from '../components/header';
import { useContext, useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import { ThemeContext } from '../context/ThemeContext';
import { invoke, isTauri, convertFileSrc } from '@tauri-apps/api/core';
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

  const makeThumbnail = (file, maxSize = 200) =>
    new Promise((resolve, reject) => {
      const img = new Image();
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
      toast.error('El nombre del producto es obligatorio.');
      return;
    }

    if (!isTauri()) {
      toast.error('Backend Tauri no disponible. Ejecuta tauri dev.');
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
      toast.success('Producto actualizado.');
    } catch (error) {
      console.error('Error al actualizar producto:', error);
      toast.error('No se pudo actualizar el producto.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedProduct) {
      return;
    }

    if (!isTauri()) {
      toast.error('Backend Tauri no disponible. Ejecuta tauri dev.');
      return;
    }

    try {
      await invoke('delete_producto', { id: selectedProduct.id_producto });
      setProducts((prev) =>
        prev.filter((product) => product.id_producto !== selectedProduct.id_producto)
      );
      closeDeleteModal();
      toast.success('Producto eliminado.');
    } catch (error) {
      console.error('Error al eliminar producto:', error);
      toast.error('No se pudo eliminar el producto.');
    }
  };

  //Métricas del dashboard
  const metrics = [
    { label: "Total Productos", value: totalStock, icon: "📦", color: "bg-rose-100 text-rose-700" },
    { label: "Productos con Stock Bajo", value: lowStockCount, icon: "⚠️", color: "bg-yellow-100 text-yellow-700" },
    { label: "Ventas Hoy", value: `$${salesToday.toFixed(2)}`, icon: "💵", color: "bg-green-100 text-green-700" },
    { label: "Ventas Mes", value: `$${salesMonth.toFixed(2)}`, icon: "📈", color: "bg-sky-100 text-sky-700" },
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
                  <th>Acciones</th>
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
                      </span>
                    </td>
                    <td>{categoryName}</td>
                    <td>{p.stock}</td>
                    <td>${p.precio}</td>
                    <td>
                      <div className="dashboard-table-actions">
                        <button
                          type="button"
                          className="dashboard-action-button dashboard-action-edit"
                          onClick={() => openEditModal(p)}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="dashboard-action-button dashboard-action-delete"
                          onClick={() => openDeleteModal(p)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
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

        {isEditModalOpen && selectedProduct && (
          <div className="dashboard-modal-overlay" role="dialog" aria-modal="true">
            <div className="dashboard-modal">
              <div className="dashboard-modal-header">
                <h3>Editar producto</h3>
                <p>{selectedProduct.nombre_producto}</p>
              </div>
              <div className="dashboard-modal-body">
                <div className="dashboard-image-field">
                  <div className="dashboard-image-preview">
                    {editImagePreview ? (
                      <img src={editImagePreview} alt="Vista previa" />
                    ) : (
                      <div className="dashboard-image-placeholder">Sin imagen</div>
                    )}
                  </div>
                  <label className="dashboard-image-upload">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleEditImageChange}
                    />
                    {editImagePreview ? 'Cambiar imagen' : 'Agregar imagen'}
                  </label>
                </div>
                <label className="dashboard-modal-field">
                  <span>Nombre</span>
                  <input
                    name="nombre_producto"
                    value={editForm.nombre_producto}
                    onChange={handleEditInputChange}
                    type="text"
                  />
                </label>
                <label className="dashboard-modal-field">
                  <span>Categoría</span>
                  <select
                    name="id_categoria"
                    value={editForm.id_categoria}
                    onChange={handleEditInputChange}
                  >
                    <option value="">Sin categoría</option>
                    {categories.map((cat) => (
                      <option key={cat.id_categoria} value={cat.id_categoria}>
                        {cat.nombre}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="dashboard-modal-field">
                  <span>Stock</span>
                  <input
                    name="stock"
                    value={editForm.stock}
                    onChange={handleEditInputChange}
                    type="number"
                    min="0"
                  />
                </label>
                <label className="dashboard-modal-field">
                  <span>Precio</span>
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
                  Cancelar
                </button>
                <button
                  type="button"
                  className="dashboard-modal-button dashboard-modal-primary"
                  onClick={handleConfirmUpdate}
                >
                  Guardar cambios
                </button>
              </div>
            </div>
          </div>
        )}

        {isDeleteModalOpen && selectedProduct && (
          <div className="dashboard-modal-overlay" role="dialog" aria-modal="true">
            <div className="dashboard-modal dashboard-modal-compact">
              <div className="dashboard-modal-header">
                <h3>Eliminar producto</h3>
                <p>Esta accion no se puede deshacer.</p>
              </div>
              <div className="dashboard-modal-body">
                <p className="dashboard-modal-text">
                  ¿Deseas eliminar <strong>{selectedProduct.nombre_producto}</strong>?
                </p>
              </div>
              <div className="dashboard-modal-actions">
                <button
                  type="button"
                  className="dashboard-modal-button dashboard-modal-secondary"
                  onClick={closeDeleteModal}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="dashboard-modal-button dashboard-modal-danger"
                  onClick={handleConfirmDelete}
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}