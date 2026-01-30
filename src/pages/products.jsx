import { useState } from 'react';
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
  
  const [formData, setFormData] = useState({
    nombre_producto: '',
    id_categoria: '',
    stock: '',
    precio: '',
    ruta_imagen: null
  });

  const [products, setProducts] = useState([]);

  // Agregar nueva categoría
  const handleAddCategory = () => {
    if (newCategory.trim()) {
      setCategories([...categories, newCategory]);
      setNewCategory('');
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

  // Enviar formulario
  const handleSubmitProduct = (e) => {
    e.preventDefault();
    
    if (!formData.nombre_producto || !formData.id_categoria || !formData.stock || !formData.precio) {
      alert('Por favor completa los campos obligatorios');
      return;
    }

    const newProduct = {
      id_producto: Date.now(),
      ...formData
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

    alert('Producto registrado exitosamente');
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
            {categories.map((cat, index) => (
              <div
                key={index}
                className={`categoria-item ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
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
                    {categories.map((cat, index) => (
                      <option key={index} value={cat}>
                        {cat}
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
