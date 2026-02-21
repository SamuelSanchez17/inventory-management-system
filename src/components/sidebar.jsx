import {
  CaretLeft,
  CaretRight,
  CurrencyDollar,
  FileText,
  GearSix,
  House,
  Package,
} from 'phosphor-react';
import { useContext, useState, useEffect, useCallback } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import { LanguageContext } from '../context/LanguageContext';
import translations from '../translations';

export default function Sidebar({ onNavigate, activePage, isCollapsed, toggleSidebar, profile, draftTheme, draftLanguage, draftTextSize })
{
    const { getActiveTheme } = useContext(ThemeContext);
    const { t } = useContext(LanguageContext);
    
    // Usar draft si está disponible, sino usar contexto normal
    const getActiveDraftTheme = useCallback(() => {
      if (!draftTheme) return getActiveTheme();
      if (draftTheme === 'sistema') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'oscuro' : 'claro';
      }
      return draftTheme;
    }, [draftTheme, getActiveTheme]);

    const getDrafte = useCallback((key) => {
      if (!draftLanguage) return t(key);
      const dict = translations[draftLanguage] || translations.es;
      return dict[key] !== undefined ? dict[key] : key;
    }, [draftLanguage, t]);

    const isDark = getActiveDraftTheme() === 'oscuro';

    const getDraftFontSize = () => {
      return draftTextSize === 'grande' ? '18px' : '16px';
    };

    const profileName = profile?.nombre || getDrafte('profile_default_name');
    const profileRole = profile?.cargo || getDrafte('profile_default_role');
    const profileMiniatura = profile?.miniatura_base64
      ? `data:image/jpeg;base64,${profile.miniatura_base64}`
      : null;
    
    // Estado de actividad
    const [isActive, setIsActive] = useState(true);
    const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutos

    // Detectar actividad del usuario
    useEffect(() => {
      let inactivityTimer;
      
      const resetTimer = () => {
        clearTimeout(inactivityTimer);
        setIsActive(true);
        
        inactivityTimer = setTimeout(() => {
          setIsActive(false);
        }, INACTIVITY_TIMEOUT);
      };
      
      // Eventos que resetean el timer
      const events = ['mousedown', 'keydown', 'touchstart', 'click'];
      
      events.forEach(event => {
        document.addEventListener(event, resetTimer);
      });
      
      // Inicializar timer
      inactivityTimer = setTimeout(() => {
        setIsActive(false);
      }, INACTIVITY_TIMEOUT);
      
      return () => {
        clearTimeout(inactivityTimer);
        events.forEach(event => {
          document.removeEventListener(event, resetTimer);
        });
      };
    }, []);

    return(
      <aside className={`transition-all duration-300 ease-in-out ${isCollapsed ? 'w-16' : 'w-64'} ${
        isDark 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-rose-100/80 border-rose-200'
      } border-r flex flex-col relative`} style={{ fontSize: getDraftFontSize() }}>
        {/* Botón toggle - Posicionado correctamente según el ancho */}
        <button onClick={toggleSidebar} className={`absolute z-20 p-1.5 rounded-lg shadow-sm transition-all duration-300 ${isCollapsed ? 'left-1/2 -translate-x-1/2 top-1' : 'right-3 top-3'} ${isDark ? 'bg-white/5 ring-1 ring-white/10 hover:bg-white/10' : 'bg-black/5 ring-1 ring-black/5 hover:bg-rose-200/60'}`}>
          {isCollapsed ? (
            <CaretRight size={22} weight="duotone" className={isDark ? 'text-gray-300' : ''} />
          ) : (
            <CaretLeft size={22} weight="duotone" className={isDark ? 'text-gray-300' : ''} />
          )}
        </button>

        {/* SECCIÓN PERFIL - Grid estructura Material Design */}
        <div className={`transition-all duration-300 overflow-hidden ${isCollapsed ? 'h-0 opacity-0' : 'h-auto opacity-100'}`}>
          {/* Header decorativo/banner */}
          <div className={`w-full h-24 bg-gradient-to-br ${
            isDark 
              ? 'from-gray-700 to-gray-600' 
              : 'from-rose-300 to-rose-400'
          } relative flex-shrink-0`}>
            <div className="absolute inset-0 opacity-30" style={{
              backgroundImage: 'linear-gradient(135deg, transparent 25%, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.1) 50%, transparent 50%, transparent 75%, rgba(255,255,255,0.1) 75%)',
              backgroundSize: '8px 8px'
            }} />
          </div>

          {/* Contenedor perfil (superpuesto sobre el banner) */}
          <div className="flex flex-col items-center px-4 pb-4 relative">
            {/* Avatar superpuesto */}
            <div className={`w-20 h-20 rounded-full border-4 -mt-10 mb-2 overflow-hidden flex items-center justify-center font-bold text-base transition-all duration-300 ${
              isDark 
                ? 'bg-gradient-to-br from-gray-700 to-gray-600 border-gray-800 text-pink-400' 
                : 'bg-gradient-to-br from-rose-200 to-rose-300 border-rose-100/80 text-rose-700'
            }`}>
              {profileMiniatura ? (
                <img src={profileMiniatura} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                profileName.charAt(0).toUpperCase()
              )}
            </div>

            {/* Nombre del usuario */}
            <h3 className={`text-center font-bold text-sm transition-colors duration-300 ${
              isDark ? 'text-gray-100' : 'text-rose-900'
            }`}>
              {profileName}
            </h3>

            {/* Título de la tienda */}
            <p className={`text-center text-[11px] mt-0.5 transition-colors duration-300 ${
              isDark ? 'text-gray-400' : 'text-rose-700/60'
            }`}>
              {getDrafte('sidebar_title')}
            </p>

            {/* Rango/Puesto (Subtítulo) con indicador de estatus */}
            <div className="flex items-center justify-center gap-1.5 mt-1">
              {/* Indicador de estatus - Puntito de color */}
              <div className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
                isActive 
                  ? 'bg-green-500 shadow-lg shadow-green-500/50' 
                  : 'bg-yellow-500 shadow-lg shadow-yellow-500/50'
              }`} />
              <p className={`text-xs transition-colors duration-300 ${
                isDark 
                  ? 'text-gray-400' 
                  : 'text-rose-700/75'
              }`}>
                {profileRole} • {isActive ? getDrafte('sidebar_active') : getDrafte('sidebar_inactive')}
              </p>
            </div>
          </div>

          {/* Separador visual */}
          <div className={`mx-4 h-px transition-colors duration-300 ${
            isDark ? 'bg-gray-700' : 'bg-rose-200/60'
          }`} />
        </div>

        {/* SECCIÓN NAVEGACIÓN */}
        <nav className={`flex-1 w-full flex flex-col px-3 transition-all duration-300 ${isCollapsed ? 'pt-16' : 'pt-6'}`}>
          <ul className="space-y-2">
            <li className={`flex items-center w-full ${isCollapsed ? 'justify-center' : 'justify-between'} py-2.5 px-3 rounded-lg transition-all duration-300 ${
              activePage === 'dashboard' 
                ? isDark ? 'bg-gray-700 text-pink-400 font-semibold' : 'bg-rose-200/80 text-rose-800 font-semibold'
                : isDark ? 'hover:bg-gray-700 text-gray-300 cursor-pointer' : 'hover:bg-rose-200/60 cursor-pointer'
            }`} onClick={() => onNavigate('dashboard')} title={isCollapsed ? getDrafte('sidebar_dashboard') : ''}>
              {!isCollapsed && <span className="flex-1">{getDrafte('sidebar_dashboard')}</span>}
              <House size={18} weight="duotone" className="text-current shrink-0" />
            </li>
            <li className={`flex items-center w-full ${isCollapsed ? 'justify-center' : 'justify-between'} py-2.5 px-3 rounded-lg transition-all duration-300 ${
              activePage === 'products' 
                ? isDark ? 'bg-gray-700 text-pink-400 font-semibold' : 'bg-rose-200/80 text-rose-800 font-semibold'
                : isDark ? 'hover:bg-gray-700 text-gray-300 cursor-pointer' : 'hover:bg-rose-200/60 cursor-pointer'
            }`} onClick={() => onNavigate('products')} title={isCollapsed ? getDrafte('sidebar_products') : ''}>
              {!isCollapsed && <span className="flex-1">{getDrafte('sidebar_products')}</span>}
              <Package size={18} weight="duotone" className="text-current shrink-0" />
            </li>
            <li className={`flex items-center w-full ${isCollapsed ? 'justify-center' : 'justify-between'} py-2.5 px-3 rounded-lg transition-all duration-300 ${
              activePage === 'sales' 
                ? isDark ? 'bg-gray-700 text-pink-400 font-semibold' : 'bg-rose-200/80 text-rose-800 font-semibold'
                : isDark ? 'hover:bg-gray-700 text-gray-300 cursor-pointer' : 'hover:bg-rose-200/60 cursor-pointer'
            }`} onClick={() => onNavigate('sales')} title={isCollapsed ? getDrafte('sidebar_sales') : ''}>
              {!isCollapsed && <span className="flex-1">{getDrafte('sidebar_sales')}</span>}
              <CurrencyDollar size={18} weight="duotone" className="text-current shrink-0" />
            </li>
            <li className={`flex items-center w-full ${isCollapsed ? 'justify-center' : 'justify-between'} py-2.5 px-3 rounded-lg transition-all duration-300 ${
              activePage === 'reports' 
                ? isDark ? 'bg-gray-700 text-pink-400 font-semibold' : 'bg-rose-200/80 text-rose-800 font-semibold'
                : isDark ? 'hover:bg-gray-700 text-gray-300 cursor-pointer' : 'hover:bg-rose-200/60 cursor-pointer'
            }`} onClick={() => onNavigate('reports')} title={isCollapsed ? getDrafte('sidebar_reports') : ''}>
              {!isCollapsed && <span className="flex-1">{getDrafte('sidebar_reports')}</span>}
              <FileText size={18} weight="duotone" className="text-current shrink-0" />
            </li>
            <li className={`flex items-center w-full ${isCollapsed ? 'justify-center' : 'justify-between'} py-2.5 px-3 rounded-lg transition-all duration-300 ${
              activePage === 'settings' 
                ? isDark ? 'bg-gray-700 text-pink-400 font-semibold' : 'bg-rose-200/80 text-rose-800 font-semibold'
                : isDark ? 'hover:bg-gray-700 text-gray-300 cursor-pointer' : 'hover:bg-rose-200/60 cursor-pointer'
            }`} onClick={() => onNavigate('settings')} title={isCollapsed ? getDrafte('sidebar_settings') : ''}>
              {!isCollapsed && <span className="flex-1">{getDrafte('sidebar_settings')}</span>}
              <GearSix size={18} weight="duotone" className="text-current shrink-0" />
            </li>
          </ul>
        </nav>

        {/* Footer decorativo */}
        {!isCollapsed && (
          <div className={`w-full mt-auto pt-6 px-6 pb-4 text-center text-xs transition-colors duration-300 ${
            isDark 
              ? 'text-gray-500 border-t border-gray-700' 
              : 'text-rose-600/60 border-t border-rose-200/60'
          }`}>
            <p>© 2026 InventarioMS</p>
          </div>
        )}
      </aside>
    )
}