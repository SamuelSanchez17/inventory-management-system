import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';

export default function Sidebar({ onNavigate, activePage, isCollapsed, toggleSidebar })
{
    const { getActiveTheme } = useContext(ThemeContext);
    const isDark = getActiveTheme() === 'oscuro';

    return(
      <aside className={`transition-all duration-300 ease-in-out ${isCollapsed ? 'w-16' : 'w-64'} ${
        isDark 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-rose-100/80 border-rose-200'
      } border-r flex flex-col items-center py-8 relative`}>
        {/* Botón toggle */}
        <button onClick={toggleSidebar} className={`absolute top-4 right-4 p-1 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-rose-200/60'}`}>
          {isCollapsed ? <ChevronRight size={20} className={isDark ? 'text-gray-300' : ''} /> : <ChevronLeft size={20} className={isDark ? 'text-gray-300' : ''} />}
        </button>
        {/* Logo y nombre */}
        <div className="mb-8 text-center">
          <div className={`text-2xl font-bold tracking-wide transition-opacity duration-300 ${isCollapsed ? 'opacity-0' : 'opacity-100'} ${isDark ? 'text-pink-400' : 'text-rose-700'}`}>Inventario</div>
        </div>
        {/* Perfil */}
        <div className={`mb-8 flex flex-col items-center transition-opacity duration-300 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>
          <div className={`w-20 h-20 rounded-full mb-2 ${isDark ? 'bg-gray-700' : 'bg-rose-200'}`} />
          <div className={`font-semibold ${isDark ? 'text-gray-300' : 'text-rose-800'}`}>Mary - Inventario</div>
        </div>
        {/* Navegación */}
        <nav className="flex-1 w-full">
          <ul className="space-y-2 px-6">
            <li className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} py-2 px-3 rounded-lg transition-all duration-300 ${
              activePage === 'dashboard' 
                ? isDark ? 'bg-gray-700 text-pink-400 font-semibold' : 'bg-rose-200/80 text-rose-800 font-semibold'
                : isDark ? 'hover:bg-gray-700 text-gray-300 cursor-pointer' : 'hover:bg-rose-200/60 cursor-pointer'
            }`} onClick={() => onNavigate('dashboard')}>
              <span>🏠</span>
              {!isCollapsed && <span>Dashboard</span>}
            </li>
            <li className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} py-2 px-3 rounded-lg transition-all duration-300 ${
              activePage === 'products' 
                ? isDark ? 'bg-gray-700 text-pink-400 font-semibold' : 'bg-rose-200/80 text-rose-800 font-semibold'
                : isDark ? 'hover:bg-gray-700 text-gray-300 cursor-pointer' : 'hover:bg-rose-200/60 cursor-pointer'
            }`} onClick={() => onNavigate('products')}>
              <span>📦</span>
              {!isCollapsed && <span>Productos</span>}
            </li>
            <li className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} py-2 px-3 rounded-lg transition-all duration-300 ${
              activePage === 'sales' 
                ? isDark ? 'bg-gray-700 text-pink-400 font-semibold' : 'bg-rose-200/80 text-rose-800 font-semibold'
                : isDark ? 'hover:bg-gray-700 text-gray-300 cursor-pointer' : 'hover:bg-rose-200/60 cursor-pointer'
            }`} onClick={() => onNavigate('sales')}>
              <span>💰</span>
              {!isCollapsed && <span>Ventas</span>}
            </li>
            <li className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} py-2 px-3 rounded-lg transition-all duration-300 ${
              activePage === 'reports' 
                ? isDark ? 'bg-gray-700 text-pink-400 font-semibold' : 'bg-rose-200/80 text-rose-800 font-semibold'
                : isDark ? 'hover:bg-gray-700 text-gray-300 cursor-pointer' : 'hover:bg-rose-200/60 cursor-pointer'
            }`} onClick={() => onNavigate('reports')}>
              <span>📄</span>
              {!isCollapsed && <span>Reportes</span>}
            </li>
            <li className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} py-2 px-3 rounded-lg transition-all duration-300 ${
              activePage === 'settings' 
                ? isDark ? 'bg-gray-700 text-pink-400 font-semibold' : 'bg-rose-200/80 text-rose-800 font-semibold'
                : isDark ? 'hover:bg-gray-700 text-gray-300 cursor-pointer' : 'hover:bg-rose-200/60 cursor-pointer'
            }`} onClick={() => onNavigate('settings')}>
              <span>⚙️</span>
              {!isCollapsed && <span>Configuración</span>}
            </li>
          </ul>
        </nav>
        {/* Fondo decorativo */}
        <div className={`absolute left-0 bottom-0 w-full h-32 ${isDark ? 'bg-gradient-to-t from-gray-700 to-transparent' : 'bg-gradient-to-t from-rose-200 to-transparent'} pointer-events-none`} />
      </aside>
    )
}