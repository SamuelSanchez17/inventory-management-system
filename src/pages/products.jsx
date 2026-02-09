import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { invoke, isTauri } from '@tauri-apps/api/core';
import '../styles/products.css';
import Sidebar from '../components/sidebar';
import { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';

export default function Products({ onNavigate, currentPage, isSidebarCollapsed, toggleSidebar }) {
  const { getActiveTheme } = useContext(ThemeContext);
  const isDark = getActiveTheme() === 'oscuro';
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [miniaturaBase64, setMiniaturaBase64] = useState(null);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  
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
      toast.success('Categoría creada');
    } catch (error) {
      console.error('Error al crear categoría:', error);
      toast.error('No se pudo crear la categoría');
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
      toast.error('El nombre no puede estar vacio');
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
      toast.success('Categoria actualizada');
    } catch (error) {
      console.error('Error al actualizar categoria:', error);
      toast.error('No se pudo actualizar la categoria');
    }
  };

  const handleDeleteCategory = async (cat) => {
    if (!window.confirm('Eliminar categoria? Los productos quedaran sin categoria.')) {
      return;
    }

    if (!isTauri()) {
      toast.error('Backend Tauri no disponible. Ejecuta tauri dev.');
      return;
    }

    try {
      await invoke('delete_categoria', { id: cat.id_categoria });
      setCategories(categories.filter((c) => c.id_categoria !== cat.id_categoria));

      if (selectedCategory === cat.nombre) {
        setSelectedCategory('');
      }

      if (Number(formData.id_categoria) === cat.id_categoria) {
        setFormData({
          ...formData,
          id_categoria: ''
        });
      }

      toast.success('Categoria eliminada');
    } catch (error) {
      console.error('Error al eliminar categoria:', error);
      toast.error('No se pudo eliminar la categoria');
    }
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
      toast.error('Por favor completa los campos obligatorios');
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

      toast.success('Producto registrado exitosamente');
    } catch (error) {
      console.error('Error al crear producto:', error);
      toast.error('No se pudo guardar el producto');
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
      <main className={`flex-1 p-10 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>

        <div className="products-container">
          <h1>Agregar Productos</h1>
          
          <div className="products-layout">
        {/* Sección izquierda - Crear categoría */}
        <div className="section-categoria">
          <div className="crear-categoria">
            <h3>Nueva Categoría</h3>
            <div className="input-group">
              <input
                type="text"
                placeholder="Ej. Calzado"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
              />
              <button onClick={handleAddCategory} className="btn-add">
                Añadir
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
                        Guardar
                      </button>
                      <button
                        type="button"
                        className="btn-cat-cancel"
                        onClick={handleCancelEditCategory}
                      >
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="btn-cat-edit"
                        onClick={() => handleStartEditCategory(cat)}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="btn-cat-delete"
                        onClick={() => handleDeleteCategory(cat)}
                      >
                        Eliminar
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
            <h2>Registrar Nuevo Producto</h2>

            <form onSubmit={handleSubmitProduct}>
              {/* Sección Multimedia */}
              <div className="form-section">
                <h4>Imagen del Producto</h4>
                <div className="imagen-single-container">
                  <div className="multimedia-slot-single">
                    {formData.ruta_imagen ? (
                      <img src={formData.ruta_imagen} alt="Producto" />
                    ) : (
                      <div className="placeholder">
                        <span style={{ fontSize: '48px' }}>🖼️</span>
                        <span>Cargar imagen</span>
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
                      {formData.ruta_imagen ? 'Cambiar' : 'Cargar'}
                    </label>
                  </div>
                </div>
              </div>

              {/* Información básica */}
              <div className="form-row">
                <div className="form-group">
                  <label>Nombre del Producto *</label>
                  <input
                    type="text"
                    name="nombre_producto"
                    value={formData.nombre_producto}
                    onChange={handleInputChange}
                    placeholder="Base Líquida Mate TimeWise"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Categoría *</label>
                  <select
                    name="id_categoria"
                    value={formData.id_categoria}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Seleccionar categoría</option>
                    {categories.map((cat) => (
                      <option key={cat.id_categoria} value={cat.id_categoria}>
                        {cat.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Stock *</label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleInputChange}
                    placeholder="30"
                    min="0"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Precio *</label>
                  <input
                    type="number"
                    name="precio"
                    value={formData.precio}
                    onChange={handleInputChange}
                    placeholder="310.00"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
              </div>

              {/* Botón submit */}
              <button type="submit" className="btn-submit">
                Guardar Producto
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Tabla de productos registrados */}
      {products.length > 0 && (
        <div className="productos-registrados">
          <h3>Productos Registrados</h3>
          <div className="tabla-scroll">
            <table>
              <thead>
                <tr>
                  <th>Imagen</th>
                  <th>Nombre</th>
                  <th>Categoría</th>
                  <th>Stock</th>
                  <th>Precio</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id_producto}>
                    <td>
                      {product.ruta_imagen && (
                        <img src={product.ruta_imagen} alt={product.nombre_producto} style={{width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px'}} />
                      )}
                    </td>
                    <td>{product.nombre_producto}</td>
                    <td>{product.id_categoria}</td>
                    <td>{product.stock}</td>
                    <td>${product.precio}</td>
                    <td className="acciones">
                      <button className="btn-edit">
                        ✏️
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleDeleteProduct(product.id_producto)}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </div>
      </main>
    </div>
  );
}
