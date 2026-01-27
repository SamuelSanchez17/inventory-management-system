import Sidebar from '../components/sidebar';
import Header from '../components/header';

export default function Dashboard({ onNavigate }) {
  // Datos de ejemplo
  const metrics = [
    { label: "Total Productos", value: 421, icon: "📦", color: "bg-rose-100 text-rose-700" },
    { label: "Productos con Stock Bajo", value: 8, icon: "⚠️", color: "bg-yellow-100 text-yellow-700" },
    { label: "Ventas Hoy", value: "$3,780", icon: "💵", color: "bg-green-100 text-green-700" },
    { label: "Ventas Semana", value: "$22,450", icon: "📈", color: "bg-sky-100 text-sky-700" },
  ];

  const products = [
    { img: "/assets/base-liquida.jpg", name: "Base Líquida Mate TimeWise", category: "Maquillaje", stock: 15, price: 310 },
    { img: "/assets/alma-equil.jpg", name: "Alma Equídada Razza", category: "Maquillaje", stock: 67, price: 340 },
    { img: "/assets/immun2.jpg", name: "Immun 2 Powder Radines", category: "Meducero", stock: 22, price: 310 },
    { img: "/assets/basio.jpg", name: "Basio de Maten La Junta", category: "Maquillaje", stock: 26, price: 224 },
    { img: "/assets/eau.jpg", name: "Eau de Miefarran Climente", category: "Meducero", stock: 31, price: 225 },
  ];

  const lowStock = [
    { img: "/assets/labial.jpg", name: "Labial Gel Semi-Mate - Red Roma", category: "Maquillaje", stock: 2 },
    { img: "/assets/crema.jpg", name: "Crema Renovadora de Noche", category: "Cuidado de la Piel", stock: 3 },
    { img: "/assets/delineador.jpg", name: "Delineador Líquido Black", category: "Maquillaje", stock: 3 },
    { img: "/assets/desmaquillante.jpg", name: "Desmaquillante de Ojos", category: "Cuidado de la Piel", stock: 1 },
  ];



  return (
    <div className="min-h-screen flex bg-rose-50">
      {/* Sidebar */}
      <aside className="w-64 bg-rose-100/80 border-r border-rose-200 flex flex-col items-center py-8 relative">
        <Sidebar onNavigate={onNavigate} />
      </aside>

      {/* Main content */}
      <main className="flex-1 p-10">
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
                  <th className="py-2">Producto</th>
                  <th>Categoría</th>
                  <th>Stock</th>
                  <th>Precio Venta</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.name} className="border-b last:border-b-0 hover:bg-rose-50">
                    <td className="py-2 flex items-center gap-3">
                      <img src={p.img} alt="" className="w-10 h-10 rounded-lg object-cover border border-rose-100" />
                      <span>
                        <div className="font-semibold">{p.name}</div>
                        <div className="text-xs text-rose-400">{p.category}</div>
                      </span>
                    </td>
                    <td>{p.category}</td>
                    <td>{p.stock}</td>
                    <td>${p.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Paginación */}
            <div className="mt-4 text-xs text-rose-400 flex justify-between">
              <span>1 – 5 de 5</span>
              <span className="space-x-2">
                <button className="px-2 py-1 rounded bg-rose-100 text-rose-400">{"<"}</button>
                <button className="px-2 py-1 rounded bg-rose-100 text-rose-400">{">"}</button>
              </span>
            </div>
          </div>

          {/* Panel derecho */}
          <div className="flex flex-col gap-6">
            {/* Productos con stock bajo */}
            <div className="bg-white rounded-xl shadow p-4">
              <div className="font-semibold text-rose-800 mb-2">Productos con Stock Bajo</div>
              <ul>
                {lowStock.map((item) => (
                  <li key={item.name} className="flex items-center gap-3 py-2 border-b last:border-b-0">
                    <img src={item.img} alt="" className="w-8 h-8 rounded object-cover border border-rose-100" />
                    <div className="flex-1">
                      <div className="text-sm">{item.name}</div>
                      <div className="text-xs text-rose-400">{item.category}</div>
                    </div>
                    <span className="text-rose-600 font-bold">{item.stock}</span>
                  </li>
                ))}
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