import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { invoke, isTauri } from '@tauri-apps/api/core';
import '../styles/products.css';
import Sidebar from '../components/sidebar';
import { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import { LanguageContext } from '../context/LanguageContext';
import { Image as ImageIcon, Tag, Trash, Warning } from 'phosphor-react';

export default function Products({ onNavigate, currentPage, isSidebarCollapsed, toggleSidebar }) {
  const { getActiveTheme } = useContext(ThemeContext);
  const { t } = useContext(LanguageContext);
  const isDark = getActiveTheme() === 'oscuro';
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [miniaturaBase64, setMiniaturaBase64] = useState(null);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [showDeleteCatModal, setShowDeleteCatModal] = useState(false);
  const [pendingDeleteCat, setPendingDeleteCat] = useState(null);
  
  const [formData, setFormData] = useState({
    nombre_producto: '',
    id_categoria: '',
    stock: '',
    precio: '',
    ruta_imagen: null
  });

  const [products, setProducts] = useState([]);

  useEffect(() => {
    const loadCategories = async () => {
      if (!isTauri()) {
        return;
      }

      try {
        const data = await invoke('list_categorias');
        setCategories(data);
      } catch (error) {
        console.error('Error al cargar categorias:', error);
        toast.error('No se pudieron cargar las categorias');
      }
    };

    loadCategories();
  }, []);

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

  // Agregar nueva categoría
  const handleAddCategory = async () => {
    const nombre = newCategory.trim();
    if (!nombre) return;

    if (!isTauri()) {
      toast.error('Backend Tauri no disponible. Ejecuta tauri dev.');
      return;
    }

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
    if (!nombre) {
      toast.error(t('toast_category_name_empty'));
      return;
    }

    if (!isTauri()) {
      toast.error('Backend Tauri no disponible. Ejecuta tauri dev.');
      return;
    }

    try {
      await invoke('update_categoria', {
        categoria: { id_categoria: cat.id_categoria, nombre }
      });

      setCategories(  
        categories.map((c) =>
          c.id_categoria === cat.id_categoria ? { ...c, nombre } : c
        )
      );

      if (selectedCategory === cat.nombre) {
        setSelectedCategory(nombre);
      }

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

    if (!isTauri()) {
      toast.error('Backend Tauri no disponible. Ejecuta tauri dev.');
      setPendingDeleteCat(null);
      return;
    }

    try {
      await invoke('delete_categoria', { id: pendingDeleteCat.id_categoria });
      setCategories(categories.filter((c) => c.id_categoria !== pendingDeleteCat.id_categoria));

      if (selectedCategory === pendingDeleteCat.nombre) {
        setSelectedCategory('');
      }

      if (Number(formData.id_categoria) === pendingDeleteCat.id_categoria) {
        setFormData({
          ...formData,
          id_categoria: ''
        });
      }

      toast.success(t('toast_category_deleted'));
    } catch (error) {
      console.error('Error al eliminar categoria:', error);
      toast.error(t('toast_category_delete_error'));
    } finally {
      setPendingDeleteCat(null);
    }
  };

  const cancelDeleteCategory = () => {
    setShowDeleteCatModal(false);
    setPendingDeleteCat(null);
  };

  // Manejar cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Manejar carga de imagen
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      makeThumbnail(file)
        .then((base64) => setMiniaturaBase64(base64))
        .catch(() => setMiniaturaBase64(null));
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData({
          ...formData,
          ruta_imagen: event.target.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Envio de formulario
  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    
    if (!formData.nombre_producto || !formData.id_categoria || !formData.stock || !formData.precio) {
      toast.error(t('products_fields_required'));
      return;
    }

    if (!isTauri()) {
      toast.error('Backend Tauri no disponible. Ejecuta tauri dev.');
      return;
    }

    const idCategoria = formData.id_categoria ? Number(formData.id_categoria) : null;
    const stock = Number(formData.stock);
    const precio = Number(formData.precio);

    let imageBytes = null;
    let imageExt = null;

    if (imageFile) {
      const arrayBuffer = await imageFile.arrayBuffer();
      imageBytes = Array.from(new Uint8Array(arrayBuffer));
      imageExt = imageFile.name.split('.').pop();
    }

    try {
      const idProducto = await invoke('create_producto', {
        nombreProducto: formData.nombre_producto,
        idCategoria: idCategoria,
        imageBytes: imageBytes,
        imageExt: imageExt,
        miniaturaBase64: miniaturaBase64,
        stock,
        precio
      });

      const newProduct = {
        id_producto: idProducto,
        nombre_producto: formData.nombre_producto,
        id_categoria: idCategoria,
        ruta_imagen: formData.ruta_imagen,
        miniatura_base64: miniaturaBase64,
        stock,
        precio
      };

      setProducts([...products, newProduct]);
    
      // Resetear formulario
      setFormData({
        nombre_producto: '',
        id_categoria: '',
        stock: '',
        precio: '',
        ruta_imagen: null
      });
      setImageFile(null);
      setMiniaturaBase64(null);

      toast.success(t('toast_product_registered'));
    } catch (error) {
      console.error('Error al crear producto:', error);
      toast.error(t('toast_product_save_error'));
    }
  };

  // Eliminar producto
  const handleDeleteProduct = (id) => {
    if (window.confirm('¿Deseas eliminar este producto?')) {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  return (
    <div className={`min-h-screen flex ${isDark ? 'bg-gray-900' : 'bg-rose-50'}`}>
      {/* Sidebar */}
      <Sidebar onNavigate={onNavigate} activePage={currentPage} isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />

      {/* Main content */}
      <main className={`products-container ${isDark ? 'products-dark' : ''}`}>
          <h1>{t('products_title')}</h1>
          
          <div className="products-layout">
        {/* Sección izquierda - Crear categoría */}
        <div className="section-categoria">
          <div className="crear-categoria">
            <h3>{t('products_new_category')}</h3>
            <div className="input-group">
              <input
                type="text"
                placeholder={t('products_category_placeholder')}
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
              />
              <button onClick={handleAddCategory} className="btn-add">
                {t('products_btn_add')}
              </button>
            </div>
          </div>

          {/* Mostrar categoría seleccionada */}
          {selectedCategory && (
            <div className="categoria-seleccionada">
              <p><strong>{selectedCategory}</strong></p>
            </div>
          )}

          {/* Lista de categorías */}
          <div className="lista-categorias">
            {categories.map((cat) => (
              <div
                key={cat.id_categoria}
                className={`categoria-item ${selectedCategory === cat.nombre ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.nombre)}
              >
                <div className="categoria-info">
                  {editingCategoryId === cat.id_categoria ? (
                    <input
                      className="categoria-edit-input"
                      value={editingCategoryName}
                      onChange={(e) => setEditingCategoryName(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className="categoria-name">{cat.nombre}</span>
                  )}
                </div>
                <div className="categoria-actions" onClick={(e) => e.stopPropagation()}>
                  {editingCategoryId === cat.id_categoria ? (
                    <>
                      <button
                        type="button"
                        className="btn-cat-save"
                        onClick={() => handleSaveEditCategory(cat)}
                      >
                        {t('products_btn_save_cat')}
                      </button>
                      <button
                        type="button"
                        className="btn-cat-cancel"
                        onClick={handleCancelEditCategory}
                      >
                        {t('products_btn_cancel_cat')}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="btn-cat-edit"
                        onClick={() => handleStartEditCategory(cat)}
                      >
                        {t('products_btn_edit_cat')}
                      </button>
                      <button
                        type="button"
                        className="btn-cat-delete"
                        onClick={() => handleDeleteCategory(cat)}
                      >
                        {t('products_btn_delete_cat')}
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sección derecha - Registrar producto */}
        <div className="section-productos">
          <div className="form-container">
            <h2>{t('products_register_title')}</h2>

            <form onSubmit={handleSubmitProduct}>
              {/* Sección Multimedia */}
              <div className="form-section">
                <h4>{t('products_image_section')}</h4>
                <div className="imagen-single-container">
                  <div className="multimedia-slot-single">
                    {formData.ruta_imagen ? (
                      <img src={formData.ruta_imagen} alt="Producto" />
                    ) : (
                      <div className="placeholder">
                        <ImageIcon size={48} weight="duotone" />
                        <span>{t('products_image_load')}</span>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      style={{ display: 'none' }}
                      id="product-image"
                    />
                    <label htmlFor="product-image" className="upload-label">
                      {formData.ruta_imagen ? t('products_image_change') : t('products_image_upload')}
                    </label>
                  </div>
                </div>
              </div>

              {/* Información básica */}
              <div className="form-row">
                <div className="form-group">
                  <label>{t('products_name_label')}</label>
                  <input
                    type="text"
                    name="nombre_producto"
                    value={formData.nombre_producto}
                    onChange={handleInputChange}
                    placeholder={t('products_name_placeholder')}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>{t('products_category_label')}</label>
                  <select
                    name="id_categoria"
                    value={formData.id_categoria}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">{t('products_select_category')}</option>
                    {categories.map((cat) => (
                      <option key={cat.id_categoria} value={cat.id_categoria}>
                        {cat.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>{t('products_stock_label')}</label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleInputChange}
                    placeholder={t('products_stock_placeholder')}
                    min="0"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>{t('products_price_label')}</label>
                  <input
                    type="number"
                    name="precio"
                    value={formData.precio}
                    onChange={handleInputChange}
                    placeholder={t('products_price_placeholder')}
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
              </div>

              {/* Botón submit */}
              <button type="submit" className="btn-submit">
                {t('products_btn_save')}
              </button>
            </form>
          </div>
        </div>
      </div>
      </main>

      {/* ── Modal de confirmación para eliminar categoría ── */}
      {showDeleteCatModal && (
        <div
          className="confirm-modal-overlay"
          onClick={cancelDeleteCategory}
        >
          <div
            className={`confirm-modal-content ${
              isDark ? 'confirm-modal-dark' : 'confirm-modal-light'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icono de advertencia */}
            <div className={`confirm-modal-icon-wrapper ${
              isDark ? 'confirm-modal-icon-dark' : 'confirm-modal-icon-light'
            }`}>
              <Warning size={32} weight="duotone" />
            </div>

            {/* Título */}
            <h3 className={`confirm-modal-title ${
              isDark ? 'text-gray-100' : 'text-gray-900'
            }`}>
              {t('delete_cat_modal_title')}
            </h3>

            {/* Cuerpo */}
            <p className={`confirm-modal-body ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {t('delete_cat_modal_body')}
            </p>

            {/* Nombre de la categoría */}
            <div className={`confirm-modal-file ${
              isDark ? 'bg-gray-700/50 text-gray-300' : 'bg-gray-100 text-gray-700'
            }`}>
              <span className="confirm-modal-file-icon">
                <Tag size={16} weight="duotone" />
              </span>
              <span className="confirm-modal-file-name">
                {pendingDeleteCat?.nombre}
              </span>
            </div>

            {/* Nota de advertencia */}
            <div className={`confirm-modal-note ${
              isDark
                ? 'bg-amber-900/30 text-amber-300 border-amber-700'
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}>
              <Warning size={16} weight="duotone" /> {t('delete_cat_modal_warning')}
            </div>

            {/* Botones */}
            <div className="confirm-modal-actions">
              <button
                type="button"
                onClick={cancelDeleteCategory}
                className={`confirm-modal-btn confirm-modal-btn-cancel ${
                  isDark
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t('confirm_modal_cancel')}
              </button>
              <button
                type="button"
                onClick={confirmDeleteCategory}
                className="confirm-modal-btn confirm-modal-btn-confirm"
              >
                {t('delete_cat_modal_confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
