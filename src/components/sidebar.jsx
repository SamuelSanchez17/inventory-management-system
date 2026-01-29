import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Sidebar({ onNavigate, activePage, isCollapsed, toggleSidebar })
{
    return(
      <aside className={`transition-all duration-300 ease-in-out ${isCollapsed ? 'w-16' : 'w-64'} bg-rose-100/80 border-r border-rose-200 flex flex-col items-center py-8 relative`}>
        {/* Botón toggle */}
        <button onClick={toggleSidebar} className="absolute top-4 right-4 p-1 rounded-lg hover:bg-rose-200/60 transition-colors">
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
        {/* Logo y nombre */}
        <div className="mb-8 text-center">
          <div className={`text-2xl font-bold tracking-wide text-rose-700 transition-opacity duration-300 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>Inventario</div>
        </div>
        {/* Perfil */}
        <div className={`mb-8 flex flex-col items-center transition-opacity duration-300 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>
          <div className="w-20 h-20 rounded-full bg-rose-200 mb-2" />
          <div className="font-semibold text-rose-800">Mary - Inventario</div>
        </div>
        {/* Navegación */}
        <nav className="flex-1 w-full">
          <ul className="space-y-2 px-6">
            <li className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} py-2 px-3 rounded-lg ${activePage === 'dashboard' ? 'bg-rose-200/80 text-rose-800 font-semibold' : 'hover:bg-rose-200/60 cursor-pointer'} transition-all duration-300`} onClick={() => onNavigate('dashboard')}>

              <span>🏠</span>
              {!isCollapsed && <span>Dashboard</span>}
            </li>
            <li className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} py-2 px-3 rounded-lg ${activePage === 'products' ? 'bg-rose-200/80 text-rose-800 font-semibold' : 'hover:bg-rose-200/60 cursor-pointer'} transition-all duration-300`} onClick={() => onNavigate('products')}>
              <span>📦</span>
              {!isCollapsed && <span>Productos</span>}
            </li>
            <li className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} py-2 px-3 rounded-lg ${activePage === 'sales' ? 'bg-rose-200/80 text-rose-800 font-semibold' : 'hover:bg-rose-200/60 cursor-pointer'} transition-all duration-300`} onClick={() => onNavigate('sales')}>
              <span>💰</span>
              {!isCollapsed && <span>Ventas</span>}
            </li>
            <li className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} py-2 px-3 rounded-lg ${activePage === 'reports' ? 'bg-rose-200/80 text-rose-800 font-semibold' : 'hover:bg-rose-200/60 cursor-pointer'} transition-all duration-300`} onClick={() => onNavigate('reports')}>
              <span>📄</span>
              {!isCollapsed && <span>Reportes</span>}
            </li>
            <li className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} py-2 px-3 rounded-lg ${activePage === 'settings' ? 'bg-rose-200/80 text-rose-800 font-semibold' : 'hover:bg-rose-200/60 cursor-pointer'} transition-all duration-300`} onClick={() => onNavigate('settings')}>
              <span>⚙️</span>
              {!isCollapsed && <span>Configuración</span>}
            </li>
          </ul>
        </nav>
        {/* Fondo decorativo */}
        <div className="absolute left-0 bottom-0 w-full h-32 bg-gradient-to-t from-rose-200 to-transparent pointer-events-none" />
      </aside>
    )
}