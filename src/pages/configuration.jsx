import { useContext, useState } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import { LanguageContext } from '../context/LanguageContext';
import Sidebar from '../components/sidebar';

export default function Configuration({ onNavigate, currentPage, isSidebarCollapsed, toggleSidebar }) {
  const { theme, setTheme, textSize, setTextSize, savePreferences, isSaved, getActiveTheme } = useContext(ThemeContext);
  const { language, setLanguage, t } = useContext(LanguageContext);
  const [showSaved, setShowSaved] = useState(false);
  const isDark = getActiveTheme() === 'oscuro';

  const handleSave = () => {
    savePreferences();
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 2000);
  };

  return (
    <div className={`min-h-screen flex ${isDark ? 'bg-gray-900' : 'bg-rose-50'}`}>
      {/* Sidebar */}
      <Sidebar onNavigate={onNavigate} activePage={currentPage} isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />

      {/* Main content */}
      <main className={`flex-1 p-10 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
        <div className="max-w-2xl">
          <h1 className={`text-4xl font-bold mb-10 ${isDark ? 'text-pink-400' : 'text-rose-800'}`}>{t('config_title')}</h1>

          {/* Secciones de configuración */}
          <div className="space-y-8">
            {/* Sección de Tema */}
            <div className={`rounded-2xl shadow-lg p-8 border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-rose-100'}`}>
              <div className="flex items-start gap-4 mb-6">
                <span className="text-3xl">🌙</span>
                <div>
                  <h2 className={`text-2xl font-bold mb-1 ${isDark ? 'text-pink-400' : 'text-rose-800'}`}>{t('config_theme_title')}</h2>
                  <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>{t('config_theme_desc')}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {[
                  { value: 'claro', label: t('config_theme_light'), description: t('config_theme_light_desc') },
                  { value: 'oscuro', label: t('config_theme_dark'), description: t('config_theme_dark_desc') },
                  { value: 'sistema', label: t('config_theme_system'), description: t('config_theme_system_desc') },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setTheme(option.value)}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 text-center ${
                      theme === option.value
                        ? isDark ? 'border-pink-400 bg-gray-700 shadow-md' : 'border-rose-400 bg-rose-50 shadow-md'
                        : isDark ? 'border-gray-600 bg-gray-800 hover:border-gray-500' : 'border-gray-200 bg-white hover:border-rose-200'
                    }`}
                  >
                    <div className={`font-semibold mb-1 ${isDark ? 'text-pink-400' : 'text-rose-800'}`}>{option.label}</div>
                    <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{option.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Sección de Idioma */}
            <div className={`rounded-2xl shadow-lg p-8 border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-rose-100'}`}>
              <div className="flex items-start gap-4 mb-6">
                <span className="text-3xl">🌐</span>
                <div>
                  <h2 className={`text-2xl font-bold mb-1 ${isDark ? 'text-pink-400' : 'text-rose-800'}`}>{t('config_language_title')}</h2>
                  <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>{t('config_language_desc')}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { value: 'es', label: t('config_language_es'), description: t('config_language_es_desc') },
                  { value: 'en', label: t('config_language_en'), description: t('config_language_en_desc') },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setLanguage(option.value)}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 text-center ${
                      language === option.value
                        ? isDark ? 'border-pink-400 bg-gray-700 shadow-md' : 'border-rose-400 bg-rose-50 shadow-md'
                        : isDark ? 'border-gray-600 bg-gray-800 hover:border-gray-500' : 'border-gray-200 bg-white hover:border-rose-200'
                    }`}
                  >
                    <div className={`font-semibold mb-1 ${isDark ? 'text-pink-400' : 'text-rose-800'}`}>{option.label}</div>
                    <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{option.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Sección de Tamaño de Texto */}
            <div className={`rounded-2xl shadow-lg p-8 border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-rose-100'}`}>
              <div className="flex items-start gap-4 mb-6">
                <span className="text-3xl">📝</span>
                <div>
                  <h2 className={`text-2xl font-bold mb-1 ${isDark ? 'text-pink-400' : 'text-rose-800'}`}>{t('config_text_size_title')}</h2>
                  <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>{t('config_text_size_desc')}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { value: 'normal', label: t('config_text_normal'), size: 'text-base' },
                  { value: 'grande', label: t('config_text_large'), size: 'text-lg' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setTextSize(option.value)}
                    className={`p-6 rounded-xl border-2 transition-all duration-200 text-center ${
                      textSize === option.value
                        ? isDark ? 'border-pink-400 bg-gray-700 shadow-md' : 'border-rose-400 bg-rose-50 shadow-md'
                        : isDark ? 'border-gray-600 bg-gray-800 hover:border-gray-500' : 'border-gray-200 bg-white hover:border-rose-200'
                    }`}
                  >
                    <div className={`font-semibold mb-2 ${option.size} ${isDark ? 'text-pink-400' : 'text-rose-800'}`}>
                      {option.label}
                    </div>
                    <div className={`${option.size} ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {t('config_text_preview')}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Botón Guardar */}
            <div className="flex justify-end">
              <button
                onClick={handleSave}
                className={`px-8 py-3 rounded-xl font-semibold transition-all duration-300 transform ${
                  showSaved
                    ? 'bg-green-500 text-white shadow-lg scale-105'
                    : isSaved
                    ? isDark ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                    : isDark ? 'bg-pink-600 text-white shadow-lg hover:shadow-xl hover:scale-105 cursor-pointer' : 'bg-rose-500 text-white shadow-lg hover:shadow-xl hover:scale-105 cursor-pointer'
                }`}
                disabled={isSaved}
              >
                {showSaved ? t('config_btn_saved_success') : isSaved ? t('config_btn_saved') : t('config_btn_save')}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
