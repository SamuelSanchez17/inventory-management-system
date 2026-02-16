import {
  CaretLeft,
  CaretRight,
  CurrencyDollar,
  FileText,
  GearSix,
  HouseSimple,
  Package,
} from 'phosphor-react';
import { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import { LanguageContext } from '../context/LanguageContext';
import { House } from 'lucide-react';

export default function Sidebar({ onNavigate, activePage, isCollapsed, toggleSidebar })
{
    const { getActiveTheme } = useContext(ThemeContext);
    const { t } = useContext(LanguageContext);
    const isDark = getActiveTheme() === 'oscuro';

    return(
      <aside className={`transition-all duration-300 ease-in-out ${isCollapsed ? 'w-16' : 'w-64'} ${
        isDark 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-rose-100/80 border-rose-200'
      } border-r flex flex-col items-center py-8 relative`}>
        {/* Botón toggle */}
        <button onClick={toggleSidebar} className={`absolute top-4 right-4 p-1 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-rose-200/60'}`}>
          {isCollapsed ? (
            <CaretRight size={20} weight="duotone" className={isDark ? 'text-gray-300' : ''} />
          ) : (
            <CaretLeft size={20} weight="duotone" className={isDark ? 'text-gray-300' : ''} />
          )}
        </button>
        {/* Logo y nombre */}
        <div className="mb-8 text-center">
          <div className={`text-2xl font-bold tracking-wide transition-opacity duration-300 ${isCollapsed ? 'opacity-0' : 'opacity-100'} ${isDark ? 'text-pink-400' : 'text-rose-700'}`}>{t('sidebar_title')}</div>
        </div>
        {/* Perfil */}
        <div className={`mb-8 flex flex-col items-center transition-opacity duration-300 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>
          <div className={`w-20 h-20 rounded-full mb-2 ${isDark ? 'bg-gray-700' : 'bg-rose-200'}`} />
          <div className={`font-semibold ${isDark ? 'text-gray-300' : 'text-rose-800'}`}>{t('sidebar_profile')}</div>
        </div>
        {/* Navegación */}
        <nav className="flex-1 w-full">
          <ul className="space-y-2 px-6">
            <li className={`flex items-center w-full ${isCollapsed ? 'justify-center' : 'justify-between'} py-2 px-3 rounded-lg transition-all duration-300 ${
              activePage === 'dashboard' 
                ? isDark ? 'bg-gray-700 text-pink-400 font-semibold' : 'bg-rose-200/80 text-rose-800 font-semibold'
                : isDark ? 'hover:bg-gray-700 text-gray-300 cursor-pointer' : 'hover:bg-rose-200/60 cursor-pointer'
            }`} onClick={() => onNavigate('dashboard')}>
              {!isCollapsed && <span className="flex-1">{t('sidebar_dashboard')}</span>}
              <House size={18} weight="duotone" className="text-current shrink-0" />
            </li>
            <li className={`flex items-center w-full ${isCollapsed ? 'justify-center' : 'justify-between'} py-2 px-3 rounded-lg transition-all duration-300 ${
              activePage === 'products' 
                ? isDark ? 'bg-gray-700 text-pink-400 font-semibold' : 'bg-rose-200/80 text-rose-800 font-semibold'
                : isDark ? 'hover:bg-gray-700 text-gray-300 cursor-pointer' : 'hover:bg-rose-200/60 cursor-pointer'
            }`} onClick={() => onNavigate('products')}>
              {!isCollapsed && <span className="flex-1">{t('sidebar_products')}</span>}
              <Package size={18} weight="duotone" className="text-current shrink-0" />
            </li>
            <li className={`flex items-center w-full ${isCollapsed ? 'justify-center' : 'justify-between'} py-2 px-3 rounded-lg transition-all duration-300 ${
              activePage === 'sales' 
                ? isDark ? 'bg-gray-700 text-pink-400 font-semibold' : 'bg-rose-200/80 text-rose-800 font-semibold'
                : isDark ? 'hover:bg-gray-700 text-gray-300 cursor-pointer' : 'hover:bg-rose-200/60 cursor-pointer'
            }`} onClick={() => onNavigate('sales')}>
              {!isCollapsed && <span className="flex-1">{t('sidebar_sales')}</span>}
              <CurrencyDollar size={18} weight="duotone" className="text-current shrink-0" />
            </li>
            <li className={`flex items-center w-full ${isCollapsed ? 'justify-center' : 'justify-between'} py-2 px-3 rounded-lg transition-all duration-300 ${
              activePage === 'reports' 
                ? isDark ? 'bg-gray-700 text-pink-400 font-semibold' : 'bg-rose-200/80 text-rose-800 font-semibold'
                : isDark ? 'hover:bg-gray-700 text-gray-300 cursor-pointer' : 'hover:bg-rose-200/60 cursor-pointer'
            }`} onClick={() => onNavigate('reports')}>
              {!isCollapsed && <span className="flex-1">{t('sidebar_reports')}</span>}
              <FileText size={18} weight="duotone" className="text-current shrink-0" />
            </li>
            <li className={`flex items-center w-full ${isCollapsed ? 'justify-center' : 'justify-between'} py-2 px-3 rounded-lg transition-all duration-300 ${
              activePage === 'settings' 
                ? isDark ? 'bg-gray-700 text-pink-400 font-semibold' : 'bg-rose-200/80 text-rose-800 font-semibold'
                : isDark ? 'hover:bg-gray-700 text-gray-300 cursor-pointer' : 'hover:bg-rose-200/60 cursor-pointer'
            }`} onClick={() => onNavigate('settings')}>
              {!isCollapsed && <span className="flex-1">{t('sidebar_settings')}</span>}
              <GearSix size={18} weight="duotone" className="text-current shrink-0" />
            </li>
          </ul>
        </nav>
        {/* Fondo decorativo */}
        <div className={`absolute left-0 bottom-0 w-full h-32 ${isDark ? 'bg-gradient-to-t from-gray-700 to-transparent' : 'bg-gradient-to-t from-rose-200 to-transparent'} pointer-events-none`} />
      </aside>
    )
}