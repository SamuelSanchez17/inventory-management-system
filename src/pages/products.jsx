import { useState, useEffect, useMemo, useContext } from 'react';
import toast from 'react-hot-toast';
import { invoke, isTauri, convertFileSrc } from '@tauri-apps/api/core';
import '../styles/products.css';
import Header from '../components/header';
import { ThemeContext } from '../context/ThemeContext';
import { LanguageContext } from '../context/LanguageContext';
import { Plus } from 'phosphor-react';
import { fuzzyFilterByName } from '../utils/fuzzySearch';
import { CreateProductModal, EditProductModal, DeleteProductModal, DeleteCategoryModal } from '../components/products';

export default function Products() {
  const { getActiveTheme } = useContext(ThemeContext);
  const { t } = useContext(LanguageContext);
  const isDark = getActiveTheme() === 'oscuro';

  // ── Category state ──
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [showDeleteCatModal, setShowDeleteCatModal] = useState(false);
  const [pendingDeleteCat, setPendingDeleteCat] = useState(null);

  // ── Products state ──
  const [products, setProducts] = useState([]);

  // ── Table pagination & search ──
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [pageIndex, setPageIndex] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  // ── Create product modal ──
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [miniaturaBase64, setMiniaturaBase64] = useState(null);
  const [formData, setFormData] = useState({
    nombre_producto: '', id_categoria: '', stock: '', precio_consultora: '', precio_publico: '', ruta_imagen: null
  });

  // ── Edit product modal ──
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    nombre_producto: '', id_categoria: '', stock: '', precio_consultora: '', precio_publico: ''
  });
  const [editImageFile, setEditImageFile] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState(null);
  const [editMiniaturaBase64, setEditMiniaturaBase64] = useState(null);

  // ── Delete product modal ──
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // ══════════════════════════════════════════
  // Data loading
  // ══════════════════════════════════════════
  useEffect(() => {
    const loadData = async () => {
      if (!isTauri()) return;
      try {
        const [productsData, categoriesData] = await Promise.all([
          invoke('list_productos'), invoke('list_categorias')
        ]);
        setProducts(productsData);
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error al cargar datos:', error);
      }
    };
    loadData();
  }, []);

  // ══════════════════════════════════════════
  // Category map
  // ══════════════════════════════════════════
  const categoryMap = useMemo(() => {
    const map = new Map();
    categories.forEach((cat) => map.set(cat.id_categoria, cat.nombre));
    return map;
  }, [categories]);

  // ══════════════════════════════════════════
  // Search & Pagination
  // ══════════════════════════════════════════
  const filteredProducts = useMemo(() => {
    return fuzzyFilterByName(products, searchTerm, (product) => product.nombre_producto);
  }, [products, searchTerm]);

  useEffect(() => { setPageIndex(1); }, [searchTerm]);

  const totalItems = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const safePageIndex = Math.min(pageIndex, totalPages);
  const startIndex = (safePageIndex - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const pagedProducts = useMemo(() => filteredProducts.slice(startIndex, endIndex), [filteredProducts, startIndex, endIndex]);

  useEffect(() => { if (pageIndex !== safePageIndex) setPageIndex(safePageIndex); }, [pageIndex, safePageIndex]);

  // ══════════════════════════════════════════
  // Thumbnail helper
  // ══════════════════════════════════════════
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

  // ══════════════════════════════════════════
  // Category CRUD
  // ══════════════════════════════════════════
  const handleAddCategory = async () => {
    const nombre = newCategory.trim();
    if (!nombre) return;
    if (!isTauri()) { toast.error('Backend Tauri no disponible.'); return; }
    try {
      const idCategoria = await invoke('create_categoria', { nombre });
      setCategories([...categories, { id_categoria: idCategoria, nombre }]);
      setNewCategory('');
      toast.success(t('toast_category_created'));
    } catch (error) {
      console.error('Error al crear categoría:', error);
      toast.error(t('toast_category_create_error'));
    }
  };

  const handleStartEditCategory = (cat) => {
    setEditingCategoryId(cat.id_categoria);
    setEditingCategoryName(cat.nombre);
  };

  const handleCancelEditCategory = () => {
    setEditingCategoryId(null);
    setEditingCategoryName('');
  };

  const handleSaveEditCategory = async (cat) => {
    const nombre = editingCategoryName.trim();
    if (!nombre) { toast.error(t('toast_category_name_empty')); return; }
    if (!isTauri()) { toast.error('Backend Tauri no disponible.'); return; }
    try {
      await invoke('update_categoria', { categoria: { id_categoria: cat.id_categoria, nombre } });
      setCategories(categories.map((c) => c.id_categoria === cat.id_categoria ? { ...c, nombre } : c));
      if (selectedCategory === cat.nombre) setSelectedCategory(nombre);
      handleCancelEditCategory();
      toast.success(t('toast_category_updated'));
    } catch (error) {
      console.error('Error al actualizar categoria:', error);
      toast.error(t('toast_category_update_error'));
    }
  };

  const handleDeleteCategory = (cat) => {
    setPendingDeleteCat(cat);
    setShowDeleteCatModal(true);
  };

  const confirmDeleteCategory = async () => {
    if (!pendingDeleteCat) return;
    setShowDeleteCatModal(false);
    if (!isTauri()) { toast.error('Backend Tauri no disponible.'); setPendingDeleteCat(null); return; }
    try {
      await invoke('delete_categoria', { id: pendingDeleteCat.id_categoria });
      setCategories(categories.filter((c) => c.id_categoria !== pendingDeleteCat.id_categoria));
      if (selectedCategory === pendingDeleteCat.nombre) setSelectedCategory('');
      if (Number(formData.id_categoria) === pendingDeleteCat.id_categoria) {
        setFormData({ ...formData, id_categoria: '' });
      }
      toast.success(t('toast_category_deleted'));
    } catch (error) {
      console.error('Error al eliminar categoria:', error);
      toast.error(t('toast_category_delete_error'));
    } finally { setPendingDeleteCat(null); }
  };

  const cancelDeleteCategory = () => {
    setShowDeleteCatModal(false);
    setPendingDeleteCat(null);
  };

  // ══════════════════════════════════════════
  // Create Product
  // ══════════════════════════════════════════
  const openCreateModal = () => {
    setFormData({ nombre_producto: '', id_categoria: '', stock: '', precio_consultora: '', precio_publico: '', ruta_imagen: null });
    setImageFile(null);
    setMiniaturaBase64(null);
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    setImageFile(null);
    setMiniaturaBase64(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      makeThumbnail(file).then((base64) => setMiniaturaBase64(base64)).catch(() => setMiniaturaBase64(null));
      const reader = new FileReader();
      reader.onload = (event) => { setFormData({ ...formData, ruta_imagen: event.target.result }); };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    if (!formData.nombre_producto || !formData.id_categoria || !formData.stock || !formData.precio_consultora || !formData.precio_publico) {
      toast.error(t('products_fields_required')); return;
    }
    if (!isTauri()) { toast.error('Backend Tauri no disponible.'); return; }

    const idCategoria = formData.id_categoria ? Number(formData.id_categoria) : null;
    const stock = Number(formData.stock);
    const precioConsultora = Number(formData.precio_consultora);
    const precioPublico = Number(formData.precio_publico);

    if (Number.isNaN(precioConsultora) || Number.isNaN(precioPublico)) {
      toast.error(t('products_fields_required')); return;
    }
    if (precioPublico < precioConsultora) {
      toast.error('El precio público debe ser mayor o igual al precio consultora.'); return;
    }

    let imageBytes = null, imageExt = null;
    if (imageFile) {
      const arrayBuffer = await imageFile.arrayBuffer();
      imageBytes = Array.from(new Uint8Array(arrayBuffer));
      imageExt = imageFile.name.split('.').pop();
    }

    try {
      const idProducto = await invoke('create_producto', {
        nombreProducto: formData.nombre_producto, idCategoria, imageBytes, imageExt, miniaturaBase64,
        stock, precio: precioPublico, precioConsultora, precioPublico
      });
      const newProduct = {
        id_producto: idProducto, nombre_producto: formData.nombre_producto, id_categoria: idCategoria,
        ruta_imagen: formData.ruta_imagen, miniatura_base64: miniaturaBase64, stock,
        precio: precioPublico, precio_consultora: precioConsultora, precio_publico: precioPublico
      };
      setProducts([...products, newProduct]);
      closeCreateModal();
      toast.success(t('toast_product_registered'));
    } catch (error) {
      console.error('Error al crear producto:', error);
      toast.error(t('toast_product_save_error'));
    }
  };

  // ══════════════════════════════════════════
  // Edit Product
  // ══════════════════════════════════════════
  const openEditModal = (product) => {
    setSelectedProduct(product);
    setEditForm({
      nombre_producto: product.nombre_producto ?? '',
      id_categoria: product.id_categoria ?? '',
      stock: product.stock ?? '',
      precio_consultora: product.precio_consultora ?? product.precio ?? '',
      precio_publico: product.precio_publico ?? product.precio ?? ''
    });
    const initialPreview = product.miniatura_base64
      ? `data:image/jpeg;base64,${product.miniatura_base64}`
      : product.ruta_imagen ? convertFileSrc(product.ruta_imagen) : null;
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

  const handleEditInputChange = (event) => {
    const { name, value } = event.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setEditImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setEditImagePreview(e.target.result);
    reader.readAsDataURL(file);
    makeThumbnail(file).then((base64) => setEditMiniaturaBase64(base64)).catch(() => setEditMiniaturaBase64(null));
  };

  const handleConfirmUpdate = async () => {
    if (!selectedProduct) return;
    const nombre_producto = editForm.nombre_producto.trim();
    if (!nombre_producto) { toast.error(t('toast_name_required')); return; }
    if (!isTauri()) { toast.error(t('toast_tauri_unavailable')); return; }

    const id_categoria = editForm.id_categoria === '' ? null : Number(editForm.id_categoria);
    const stock = Number(editForm.stock);
    const precio_consultora = Number(editForm.precio_consultora);
    const precio_publico = Number(editForm.precio_publico);

    if (Number.isNaN(stock) || Number.isNaN(precio_consultora) || Number.isNaN(precio_publico)) {
      toast.error(t('products_fields_required')); return;
    }
    if (precio_publico < precio_consultora) {
      toast.error('El precio publico debe ser mayor o igual al precio consultora.'); return;
    }

    const updatedProduct = {
      ...selectedProduct, nombre_producto, id_categoria, stock,
      precio: precio_publico, precio_consultora, precio_publico,
      miniatura_base64: editMiniaturaBase64 ?? selectedProduct.miniatura_base64
    };

    let imageBytes = null, imageExt = null;
    if (editImageFile) {
      const arrayBuffer = await editImageFile.arrayBuffer();
      imageBytes = Array.from(new Uint8Array(arrayBuffer));
      imageExt = editImageFile.name.split('.').pop();
    }

    try {
      await invoke('update_producto', {
        producto: updatedProduct, imageBytes, imageExt,
        miniaturaBase64: editMiniaturaBase64, precioConsultora: precio_consultora, precioPublico: precio_publico
      });
      setProducts((prev) => prev.map((p) => p.id_producto === updatedProduct.id_producto ? updatedProduct : p));
      closeEditModal();
      toast.success(t('toast_product_updated'));
    } catch (error) {
      console.error('Error al actualizar producto:', error);
      toast.error(t('toast_product_update_error'));
    }
  };

  // ══════════════════════════════════════════
  // Delete Product
  // ══════════════════════════════════════════
  const openDeleteModal = (product) => {
    setSelectedProduct(product);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedProduct(null);
  };

  const handleConfirmDelete = async () => {
    if (!selectedProduct) return;
    if (!isTauri()) { toast.error(t('toast_tauri_unavailable')); return; }
    try {
      await invoke('delete_producto', { id: selectedProduct.id_producto });
      setProducts((prev) => prev.filter((p) => p.id_producto !== selectedProduct.id_producto));
      closeDeleteModal();
      toast.success(t('toast_product_deleted'));
    } catch (error) {
      console.error('Error al eliminar producto:', error);
      toast.error(t('toast_product_delete_error'));
    }
  };

  // ══════════════════════════════════════════
  // Render
  // ══════════════════════════════════════════
  return (
    <>
      <main className={`products-container ${isDark ? 'products-dark' : ''}`}>
        <Header searchTerm={searchTerm} onSearchChange={setSearchTerm} title={t('sidebar_products')} subtitle={t('products_subtitle')} />

        <div className="products-layout">
          {/* ── Categorías ── */}
          <div className="section-categoria">
            <div className="crear-categoria">
              <h3>{t('products_new_category')}</h3>
              <div className="input-group">
                <input type="text" placeholder={t('products_category_placeholder')} value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()} />
                <button onClick={handleAddCategory} className="btn-add">{t('products_btn_add')}</button>
              </div>
            </div>

            {selectedCategory && (<div className="categoria-seleccionada"><p><strong>{selectedCategory}</strong></p></div>)}

            <div className="lista-categorias">
              {categories.map((cat) => (
                <div key={cat.id_categoria}
                  className={`categoria-item ${selectedCategory === cat.nombre ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat.nombre)}>
                  <div className="categoria-info">
                    {editingCategoryId === cat.id_categoria ? (
                      <input className="categoria-edit-input" value={editingCategoryName}
                        onChange={(e) => setEditingCategoryName(e.target.value)} onClick={(e) => e.stopPropagation()} />
                    ) : (<span className="categoria-name">{cat.nombre}</span>)}
                  </div>
                  <div className="categoria-actions" onClick={(e) => e.stopPropagation()}>
                    {editingCategoryId === cat.id_categoria ? (
                      <>
                        <button type="button" className="btn-cat-save" onClick={() => handleSaveEditCategory(cat)}>{t('products_btn_save_cat')}</button>
                        <button type="button" className="btn-cat-cancel" onClick={handleCancelEditCategory}>{t('products_btn_cancel_cat')}</button>
                      </>
                    ) : (
                      <>
                        <button type="button" className="btn-cat-edit" onClick={() => handleStartEditCategory(cat)}>{t('products_btn_edit_cat')}</button>
                        <button type="button" className="btn-cat-delete" onClick={() => handleDeleteCategory(cat)}>{t('products_btn_delete_cat')}</button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Tabla de productos ── */}
          <div className="products-table-container">
            <div className="products-table-header">
              <h2 className="products-section-title">{t('dashboard_section_products')}</h2>
              <button type="button" className="products-btn-add-product" onClick={openCreateModal}>
                <Plus size={18} weight="bold" /><span>{t('products_btn_add_product')}</span>
              </button>
            </div>

            <table className="products-table">
              <thead>
                <tr>
                  <th>{t('dashboard_col_name')}</th>
                  <th>{t('dashboard_col_category')}</th>
                  <th>{t('dashboard_col_stock')}</th>
                  <th>{t('products_col_price_consultora')}</th>
                  <th>{t('products_col_price_publico')}</th>
                  <th>{t('dashboard_col_actions')}</th>
                </tr>
              </thead>
              <tbody>
                {pagedProducts.length === 0 ? (
                  <tr><td colSpan="6"><div className="products-table-empty">{t('products_table_empty')}</div></td></tr>
                ) : (
                  pagedProducts.map((p) => {
                    const categoryName = categoryMap.get(p.id_categoria) || t('dashboard_no_category');
                    const imageSrc = p.miniatura_base64
                      ? `data:image/jpeg;base64,${p.miniatura_base64}`
                      : p.ruta_imagen ? convertFileSrc(p.ruta_imagen) : null;
                    return (
                      <tr key={p.id_producto ?? p.nombre_producto}>
                        <td className="table-cell-product">
                          {imageSrc ? (<img src={imageSrc} alt="" className="product-thumbnail" />) : (<div className="product-thumbnail-placeholder" />)}
                          <div className="product-info"><div className="product-name">{p.nombre_producto}</div></div>
                        </td>
                        <td className="table-cell-category" title={categoryName}>{categoryName}</td>
                        <td>{p.stock}</td>
                        <td className="table-cell-price">${Number(p.precio_consultora ?? p.precio ?? 0).toFixed(2)}</td>
                        <td className="table-cell-price table-cell-price-public">${Number(p.precio_publico ?? p.precio ?? 0).toFixed(2)}</td>
                        <td>
                          <div className="products-table-actions">
                            <button type="button" className="products-action-button products-action-edit" onClick={() => openEditModal(p)}>{t('dashboard_btn_edit')}</button>
                            <button type="button" className="products-action-button products-action-delete" onClick={() => openDeleteModal(p)}>{t('dashboard_btn_delete')}</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            {/* Paginación */}
            <div className="products-pagination">
              <span>{totalItems === 0 ? `0 – 0 ${t('dashboard_of')} 0` : `${startIndex + 1} – ${endIndex} ${t('dashboard_of')} ${totalItems}`}</span>
              <div className="pagination-controls">
                <label className="items-per-page">
                  <span>{t('dashboard_pagination_show')}</span>
                  <select value={itemsPerPage} onChange={(event) => { setItemsPerPage(Number(event.target.value)); setPageIndex(1); }}>
                    {[10, 20, 30].map((size) => (<option key={size} value={size}>{size}</option>))}
                  </select>
                </label>
                <span className="pagination-buttons">
                  <button onClick={() => setPageIndex((prev) => Math.max(1, prev - 1))} disabled={safePageIndex === 1}>{"<"}</button>
                  <button onClick={() => setPageIndex((prev) => Math.min(totalPages, prev + 1))} disabled={safePageIndex === totalPages}>{">"}</button>
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ══════════════════════════════════════════ */}
      {/* Modals (extracted components) */}
      {/* ══════════════════════════════════════════ */}
      <CreateProductModal
        open={isCreateModalOpen}
        onClose={closeCreateModal}
        formData={formData}
        onInputChange={handleInputChange}
        onImageUpload={handleImageUpload}
        onSubmit={handleSubmitProduct}
        categories={categories}
        t={t}
        isDark={isDark}
      />

      <EditProductModal
        open={isEditModalOpen}
        product={selectedProduct}
        formData={editForm}
        onFormChange={handleEditInputChange}
        onImageChange={handleEditImageChange}
        onSave={handleConfirmUpdate}
        onCancel={closeEditModal}
        categories={categories}
        t={t}
        isDark={isDark}
        editImagePreview={editImagePreview}
      />

      <DeleteProductModal
        open={isDeleteModalOpen}
        product={selectedProduct}
        onConfirm={handleConfirmDelete}
        onCancel={closeDeleteModal}
        t={t}
        isDark={isDark}
      />

      <DeleteCategoryModal
        open={showDeleteCatModal}
        category={pendingDeleteCat}
        onConfirm={confirmDeleteCategory}
        onCancel={cancelDeleteCategory}
        t={t}
        isDark={isDark}
      />
    </>
  );
}
