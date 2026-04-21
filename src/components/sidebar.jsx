import {
  CaretLeft,
  CaretRight,
  CurrencyDollar,
  FileText,
  GearSix,
  House,
  Package,
} from 'phosphor-react';
import { useContext, useEffect, useState } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import { LanguageContext } from '../context/LanguageContext';

const INACTIVITY_TIMEOUT = 5 * 60 * 1000;

export default function Sidebar({ onNavigate, activePage, isCollapsed, profile }) {
    const { getActiveTheme } = useContext(ThemeContext);
    const { t } = useContext(LanguageContext);

    const isDark = getActiveTheme() === 'oscuro';

    const [isActive, setIsActive] = useState(true);

    useEffect(() => {
      let inactivityTimer;

      const resetTimer = () => {
        clearTimeout(inactivityTimer);
        setIsActive(true);

        inactivityTimer = setTimeout(() => {
          setIsActive(false);
        }, INACTIVITY_TIMEOUT);
      };

      const events = ['mousedown', 'keydown', 'touchstart', 'click'];
      events.forEach((event) => {
        document.addEventListener(event, resetTimer);
      });

      inactivityTimer = setTimeout(() => {
        setIsActive(false);
      }, INACTIVITY_TIMEOUT);

      return () => {
        clearTimeout(inactivityTimer);
        events.forEach((event) => {
          document.removeEventListener(event, resetTimer);
        });
      };
    }, []);

    return(
      <aside className={`h-full overflow-y-auto transition-all duration-300 ease-in-out ${isCollapsed ? 'w-16' : 'w-64'} ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-rose-100/80 border-rose-200'} border-r flex flex-col relative`}>
        <div className={`transition-all duration-300 overflow-hidden ${isCollapsed ? 'h-0 opacity-0' : 'h-auto opacity-100'}`}>
          <div className={`w-full h-24 bg-gradient-to-br ${isDark ? 'from-gray-700 to-gray-600' : 'from-rose-300 to-rose-400'} relative flex-shrink-0`}>
            <div className="absolute inset-0 opacity-30" style={{
              backgroundImage: 'linear-gradient(135deg, transparent 25%, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.1) 50%, transparent 50%, transparent 75%, rgba(255,255,255,0.1) 75%)',
              backgroundSize: '8px 8px'
            }} />
          </div>

          <div className="flex flex-col items-center px-4 pb-4 relative">
            <div className={`w-20 h-20 rounded-full border-4 -mt-10 mb-2 overflow-hidden flex items-center justify-center font-bold text-base transition-all duration-300 ${isDark ? 'bg-gradient-to-br from-gray-700 to-gray-600 border-gray-800 text-pink-400' : 'bg-gradient-to-br from-rose-200 to-rose-300 border-rose-100/80 text-rose-700'}`}>
              {profile?.miniatura_base64 ? (
                <img src={`data:image/jpeg;base64,${profile.miniatura_base64}`} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                (profile?.nombre || t('profile_default_name')).charAt(0).toUpperCase()
              )}
            </div>

            <h3 className={`text-center font-bold text-sm transition-colors duration-300 ${isDark ? 'text-gray-100' : 'text-rose-900'}`}>
              {profile?.nombre || t('profile_default_name')}
            </h3>

            <p className={`text-center text-[11px] mt-0.5 transition-colors duration-300 ${isDark ? 'text-gray-400' : 'text-rose-700/60'}`}>
              {t('sidebar_title')}
            </p>

            <div className="flex items-center justify-center gap-1.5 mt-1">
              <div className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${isActive ? 'bg-green-500 shadow-lg shadow-green-500/50' : 'bg-yellow-500 shadow-lg shadow-yellow-500/50'}`} />
              <p className={`text-xs transition-colors duration-300 ${isDark ? 'text-gray-400' : 'text-rose-700/75'}`}>
                {(profile?.cargo || t('profile_default_role'))} • {isActive ? t('sidebar_active') : t('sidebar_inactive')}
              </p>
            </div>
          </div>

          <div className={`mx-4 h-px transition-colors duration-300 ${isDark ? 'bg-gray-700' : 'bg-rose-200/60'}`} />
        </div>

        <nav className={`flex-1 w-full flex flex-col px-3 transition-all duration-300 ${isCollapsed ? 'pt-16' : 'pt-6'}`}>
          <ul className="space-y-2">
            <li className={`flex items-center w-full ${isCollapsed ? 'justify-center' : 'justify-between'} py-2.5 px-3 rounded-lg transition-all duration-300 ${
              activePage === 'dashboard' 
                ? isDark ? 'bg-gray-700 text-pink-400 font-semibold' : 'bg-rose-200/80 text-rose-800 font-semibold'
                : isDark ? 'hover:bg-gray-700 text-gray-300 cursor-pointer' : 'hover:bg-rose-200/60 cursor-pointer'
            }`} onClick={() => onNavigate('dashboard')} title={isCollapsed ? t('sidebar_dashboard') : ''}>
              {!isCollapsed && <span className="flex-1">{t('sidebar_dashboard')}</span>}
              <House size={18} weight="duotone" className="text-current shrink-0" />
            </li>
            <li className={`flex items-center w-full ${isCollapsed ? 'justify-center' : 'justify-between'} py-2.5 px-3 rounded-lg transition-all duration-300 ${
              activePage === 'products' 
                ? isDark ? 'bg-gray-700 text-pink-400 font-semibold' : 'bg-rose-200/80 text-rose-800 font-semibold'
                : isDark ? 'hover:bg-gray-700 text-gray-300 cursor-pointer' : 'hover:bg-rose-200/60 cursor-pointer'
            }`} onClick={() => onNavigate('products')} title={isCollapsed ? t('sidebar_products') : ''}>
              {!isCollapsed && <span className="flex-1">{t('sidebar_products')}</span>}
              <Package size={18} weight="duotone" className="text-current shrink-0" />
            </li>
            <li className={`flex items-center w-full ${isCollapsed ? 'justify-center' : 'justify-between'} py-2.5 px-3 rounded-lg transition-all duration-300 ${
              activePage === 'sales' 
                ? isDark ? 'bg-gray-700 text-pink-400 font-semibold' : 'bg-rose-200/80 text-rose-800 font-semibold'
                : isDark ? 'hover:bg-gray-700 text-gray-300 cursor-pointer' : 'hover:bg-rose-200/60 cursor-pointer'
            }`} onClick={() => onNavigate('sales')} title={isCollapsed ? t('sidebar_sales') : ''}>
              {!isCollapsed && <span className="flex-1">{t('sidebar_sales')}</span>}
              <CurrencyDollar size={18} weight="duotone" className="text-current shrink-0" />
            </li>
            <li className={`flex items-center w-full ${isCollapsed ? 'justify-center' : 'justify-between'} py-2.5 px-3 rounded-lg transition-all duration-300 ${
              activePage === 'reports' 
                ? isDark ? 'bg-gray-700 text-pink-400 font-semibold' : 'bg-rose-200/80 text-rose-800 font-semibold'
                : isDark ? 'hover:bg-gray-700 text-gray-300 cursor-pointer' : 'hover:bg-rose-200/60 cursor-pointer'
            }`} onClick={() => onNavigate('reports')} title={isCollapsed ? t('sidebar_reports') : ''}>
              {!isCollapsed && <span className="flex-1">{t('sidebar_reports')}</span>}
              <FileText size={18} weight="duotone" className="text-current shrink-0" />
            </li>
            <li className={`flex items-center w-full ${isCollapsed ? 'justify-center' : 'justify-between'} py-2.5 px-3 rounded-lg transition-all duration-300 ${
              activePage === 'settings' 
                ? isDark ? 'bg-gray-700 text-pink-400 font-semibold' : 'bg-rose-200/80 text-rose-800 font-semibold'
                : isDark ? 'hover:bg-gray-700 text-gray-300 cursor-pointer' : 'hover:bg-rose-200/60 cursor-pointer'
            }`} onClick={() => onNavigate('settings')} title={isCollapsed ? t('sidebar_settings') : ''}>
              {!isCollapsed && <span className="flex-1">{t('sidebar_settings')}</span>}
              <GearSix size={18} weight="duotone" className="text-current shrink-0" />
            </li>
          </ul>
        </nav>

        {!isCollapsed && (
          <div className={`w-full mt-auto pt-6 px-6 pb-4 text-center text-xs transition-colors duration-300 ${
            isDark 
              ? 'text-gray-500 border-t border-gray-700' 
              : 'text-rose-600/60 border-t border-rose-200/60'
          }`}>
            <p>© 2026 StockBeauty</p>
          </div>
        )}
      </aside>
    )
}