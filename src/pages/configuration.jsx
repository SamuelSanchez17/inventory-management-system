import { useContext, useState } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import Sidebar from '../components/sidebar';

export default function Configuration({ onNavigate, currentPage, isSidebarCollapsed, toggleSidebar }) {
  const { theme, setTheme, accentColor, setAccentColor, textSize, setTextSize, savePreferences, isSaved, getActiveTheme } = useContext(ThemeContext);
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
          <h1 className={`text-4xl font-bold mb-10 ${isDark ? 'text-pink-400' : 'text-rose-800'}`}>Configuración</h1>

          {/* Secciones de configuración */}
          <div className="space-y-8">
            {/* Sección de Tema */}
            <div className={`rounded-2xl shadow-lg p-8 border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-rose-100'}`}>
              <div className="flex items-start gap-4 mb-6">
                <span className="text-3xl">🌙</span>
                <div>
                  <h2 className={`text-2xl font-bold mb-1 ${isDark ? 'text-pink-400' : 'text-rose-800'}`}>Modo</h2>
                  <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Elige el modo visual de la aplicación</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {[
                  { value: 'claro', label: '☀️ Claro', description: 'Interfaz clara' },
                  { value: 'oscuro', label: '🌙 Oscuro', description: 'Interfaz oscura' },
                  { value: 'sistema', label: '⚙️ Sistema', description: 'Seguir del sistema' },
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

            {/* Sección de Color de Acento */}
            <div className={`rounded-2xl shadow-lg p-8 border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-rose-100'}`}>
              <div className="flex items-start gap-4 mb-6">
                <span className="text-3xl">🎨</span>
                <div>
                  <h2 className={`text-2xl font-bold mb-1 ${isDark ? 'text-pink-400' : 'text-rose-800'}`}>Color de Acento</h2>
                  <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Personaliza el color principal de la aplicación</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { value: 'rose', label: 'Rosa', color: 'bg-rose-500' },
                  { value: 'pink', label: 'Rosado', color: 'bg-pink-500' },
                  { value: 'fuchsia', label: 'Fucsia', color: 'bg-fuchsia-500' },
                  { value: 'purple', label: 'Púrpura', color: 'bg-purple-500' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setAccentColor(option.value)}
                    className={`p-4 rounded-xl border-3 transition-all duration-200 flex flex-col items-center gap-2 ${
                      accentColor === option.value
                        ? 'border-gray-800 shadow-lg scale-105'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-full ${option.color} shadow-md`} />
                    <div className={`font-semibold text-sm ${isDark ? 'text-pink-400' : 'text-rose-800'}`}>{option.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Sección de Tamaño de Texto */}
            <div className={`rounded-2xl shadow-lg p-8 border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-rose-100'}`}>
              <div className="flex items-start gap-4 mb-6">
                <span className="text-3xl">📝</span>
                <div>
                  <h2 className={`text-2xl font-bold mb-1 ${isDark ? 'text-pink-400' : 'text-rose-800'}`}>Tamaño de Texto</h2>
                  <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Ajusta el tamaño del texto para mayor comodidad</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { value: 'normal', label: 'Normal', size: 'text-base' },
                  { value: 'grande', label: 'Grande', size: 'text-lg' },
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
                      El texto se verá así
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
                {showSaved ? '✓ ¡Guardado!' : isSaved ? 'Guardado' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
