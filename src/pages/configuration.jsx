import { useContext, useEffect, useRef, useState, useCallback } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import { LanguageContext } from '../context/LanguageContext';
import { invoke, isTauri } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import toast from 'react-hot-toast';
import { FileText, FolderOpen, Globe, Moon, ShieldCheck, TextAa, Warning } from 'phosphor-react';
import translations from '../translations';

export default function Configuration() {
  const { theme, setTheme, textSize, setTextSize, savePreferences } = useContext(ThemeContext);
  const { language, setLanguage, t } = useContext(LanguageContext);
  const [showSaved, setShowSaved] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingFilePath, setPendingFilePath] = useState(null);

  // ── Estados locales (draft) para cambios pendientes ──
  const [draftTheme, setDraftTheme] = useState(theme);
  const [draftLanguage, setDraftLanguage] = useState(language);
  const [draftTextSize, setDraftTextSize] = useState(textSize);

  const initialThemeRef = useRef(theme);
  const initialLanguageRef = useRef(language);
  const initialTextSizeRef = useRef(textSize);

  // Detectar si hay cambios pendientes contra el estado inicial confirmado
  const hasChanges =
    draftTheme !== initialThemeRef.current ||
    draftLanguage !== initialLanguageRef.current ||
    draftTextSize !== initialTextSizeRef.current;

  // ── Funciones para preview en vivo (solo en esta página) ──
  const getActiveDraftTheme = () => {
    if (draftTheme === 'sistema') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'oscuro' : 'claro';
    }
    return draftTheme;
  };

  const getDraftt = useCallback(
    (key) => {
      const dict = translations[draftLanguage] || translations.es;
      return dict[key] !== undefined ? dict[key] : key;
    },
    [draftLanguage]
  );

  // Obtener tamaño de fuente para preview
  const getDraftFontSize = () => {
    return draftTextSize === 'grande' ? '18px' : '16px';
  };

  // Usar draft para preview en vivo
  const isDark = getActiveDraftTheme() === 'oscuro';

  useEffect(() => {
    setTheme(draftTheme);
  }, [draftTheme, setTheme]);

  useEffect(() => {
    setLanguage(draftLanguage);
  }, [draftLanguage, setLanguage]);

  useEffect(() => {
    setTextSize(draftTextSize);
  }, [draftTextSize, setTextSize]);

  useEffect(() => {
    return () => {
      // Si el usuario sale sin guardar, restaura el estado confirmado.
      if (
        draftTheme !== initialThemeRef.current ||
        draftLanguage !== initialLanguageRef.current ||
        draftTextSize !== initialTextSizeRef.current
      ) {
        setTheme(initialThemeRef.current);
        setLanguage(initialLanguageRef.current);
        setTextSize(initialTextSizeRef.current);
      }
    };
  }, [draftTheme, draftLanguage, draftTextSize, setTheme, setLanguage, setTextSize]);

  const handleSave = () => {
    // Aplicar todos los cambios al contexto global
    if (draftTheme !== theme) setTheme(draftTheme);
    if (draftLanguage !== language) setLanguage(draftLanguage);
    if (draftTextSize !== textSize) setTextSize(draftTextSize);
    
    savePreferences();
    initialThemeRef.current = draftTheme;
    initialLanguageRef.current = draftLanguage;
    initialTextSizeRef.current = draftTextSize;
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 2000);
  };

  const handleCancel = () => {
    // Descartar cambios y volver a los valores originales
    setDraftTheme(initialThemeRef.current);
    setDraftLanguage(initialLanguageRef.current);
    setDraftTextSize(initialTextSizeRef.current);
    setTheme(initialThemeRef.current);
    setLanguage(initialLanguageRef.current);
    setTextSize(initialTextSizeRef.current);
    toast(getDraftt('toast_changes_discarded') || 'Cambios descartados', { 
      icon: 'ℹ️' 
    });
  };

  const handleImportDB = async () => {
    if (!isTauri()) return;

    try {
      const filePath = await open({
        multiple: false,
        filters: [{ name: 'Database', extensions: ['db'] }],
      });

      if (!filePath) {
        toast(t('toast_import_cancelled'), { icon: 'ℹ️' });
        return;
      }

      // Guardar ruta y mostrar modal de confirmación
      setPendingFilePath(filePath);
      setShowConfirmModal(true);
    } catch (error) {
      console.error('Error opening file dialog:', error);
      toast.error(t('toast_import_error'));
    }
  };

  const confirmImport = async () => {
    if (!pendingFilePath) return;

    setShowConfirmModal(false);
    setIsImporting(true);

    try {
      const result = await invoke('import_database', { rutaOrigen: pendingFilePath });

      if (result === 'OK') {
        toast.success(t('toast_import_success'));
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch (error) {
      console.error('Error importing DB:', error);
      const errorStr = String(error);

      if (errorStr.includes('FILE_NOT_FOUND')) {
        toast.error(t('toast_import_file_not_found'));
      } else if (errorStr.includes('INVALID_EXTENSION')) {
        toast.error(t('toast_import_invalid_ext'));
      } else if (errorStr.includes('NOT_SQLITE')) {
        toast.error(t('toast_import_not_sqlite'));
      } else if (errorStr.includes('CORRUPT_DB')) {
        toast.error(t('toast_import_corrupt'));
      } else if (errorStr.includes('MISSING_TABLE')) {
        toast.error(t('toast_import_missing_table'));
      } else {
        toast.error(t('toast_import_error'));
      }
    } finally {
      setIsImporting(false);
      setPendingFilePath(null);
    }
  };

  const cancelImport = () => {
    setShowConfirmModal(false);
    setPendingFilePath(null);
  };

  return (
    <>
    <main className={`flex-1 p-10 ${isDark ? 'text-gray-100' : 'text-gray-900'}`} style={{ fontSize: getDraftFontSize() }}>
        <h1 className={`text-4xl font-bold mb-10 ${isDark ? 'text-pink-400' : 'text-rose-800'}`}>{getDraftt('config_title')}</h1>

        {/* Layout de ajustes */}
        <div className="flex gap-8 items-start">
          <div className="flex-1 max-w-2xl space-y-8">
            <div className={`rounded-2xl shadow-lg p-8 border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-rose-100'}`}>
              <div className="flex items-start gap-4 mb-6">
                <span className="text-3xl">
                  <Moon size={28} weight="duotone" />
                </span>
                <div>
                  <h2 className={`text-2xl font-bold mb-1 ${isDark ? 'text-pink-400' : 'text-rose-800'}`}>{getDraftt('config_theme_title')}</h2>
                  <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>{getDraftt('config_theme_desc')}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {[
                  { value: 'claro', label: getDraftt('config_theme_light'), description: getDraftt('config_theme_light_desc') },
                  { value: 'oscuro', label: getDraftt('config_theme_dark'), description: getDraftt('config_theme_dark_desc') },
                  { value: 'sistema', label: getDraftt('config_theme_system'), description: getDraftt('config_theme_system_desc') },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setDraftTheme(option.value)}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 text-center ${
                      draftTheme === option.value
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
                <span className="text-3xl">
                  <Globe size={28} weight="duotone" />
                </span>
                <div>
                  <h2 className={`text-2xl font-bold mb-1 ${isDark ? 'text-pink-400' : 'text-rose-800'}`}>{getDraftt('config_language_title')}</h2>
                  <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>{getDraftt('config_language_desc')}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { value: 'es', label: getDraftt('config_language_es'), description: getDraftt('config_language_es_desc') },
                  { value: 'en', label: getDraftt('config_language_en'), description: getDraftt('config_language_en_desc') },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setDraftLanguage(option.value)}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 text-center ${
                      draftLanguage === option.value
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
                <span className="text-3xl">
                  <TextAa size={28} weight="duotone" />
                </span>
                <div>
                  <h2 className={`text-2xl font-bold mb-1 ${isDark ? 'text-pink-400' : 'text-rose-800'}`}>{getDraftt('config_text_size_title')}</h2>
                  <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>{getDraftt('config_text_size_desc')}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { value: 'normal', label: getDraftt('config_text_normal'), size: 'text-base' },
                  { value: 'grande', label: getDraftt('config_text_large'), size: 'text-lg' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setDraftTextSize(option.value)}
                    className={`p-6 rounded-xl border-2 transition-all duration-200 text-center ${
                      draftTextSize === option.value
                        ? isDark ? 'border-pink-400 bg-gray-700 shadow-md' : 'border-rose-400 bg-rose-50 shadow-md'
                        : isDark ? 'border-gray-600 bg-gray-800 hover:border-gray-500' : 'border-gray-200 bg-white hover:border-rose-200'
                    }`}
                  >
                    <div className={`font-semibold mb-2 ${option.size} ${isDark ? 'text-pink-400' : 'text-rose-800'}`}>
                      {option.label}
                    </div>
                    <div className={`${option.size} ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {getDraftt('config_text_preview')}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className={`rounded-2xl shadow-lg p-8 border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-rose-100'}`}>
              <div className="flex items-start gap-4 mb-4">
                <span className="text-3xl">
                  <FolderOpen size={28} weight="duotone" />
                </span>
                <div>
                  <h2 className={`text-2xl font-bold mb-1 ${isDark ? 'text-pink-400' : 'text-rose-800'}`}>{getDraftt('config_import_title')}</h2>
                  <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>{getDraftt('config_import_desc')}</p>
                </div>
              </div>

              <div className={`rounded-xl p-4 mb-4 text-sm ${isDark ? 'bg-amber-900/30 text-amber-300 border border-amber-700' : 'bg-amber-50 text-amber-800 border border-amber-200'}`}>
                {getDraftt('config_import_warning')}
              </div>

              <button
                type="button"
                onClick={handleImportDB}
                disabled={isImporting}
                className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-center font-semibold ${
                  isDark
                    ? 'border-gray-600 bg-gray-700 text-gray-200 hover:border-pink-400 hover:bg-gray-600'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-rose-300 hover:bg-rose-50'
                } ${isImporting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {isImporting ? '...' : getDraftt('config_import_btn')}
              </button>
            </div>


            <div className="flex justify-end gap-3">
              {hasChanges && (
                <button
                  onClick={handleCancel}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 border-2 ${
                    isDark
                      ? 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600 hover:border-gray-500'
                      : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200 hover:border-gray-400'
                  }`}
                >
                  {getDraftt('config_btn_cancel') || 'Descartar'}
                </button>
              )}
              <button
                onClick={handleSave}
                className={`px-8 py-3 rounded-xl font-semibold transition-all duration-300 transform ${
                  showSaved
                    ? 'bg-green-500 text-white shadow-lg scale-105'
                    : !hasChanges
                    ? isDark ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                    : isDark ? 'bg-pink-600 text-white shadow-lg hover:shadow-xl hover:scale-105 cursor-pointer' : 'bg-rose-500 text-white shadow-lg hover:shadow-xl hover:scale-105 cursor-pointer'
                }`}
                disabled={!hasChanges && !showSaved}
              >
                {showSaved ? getDraftt('config_btn_saved_success') : !hasChanges ? getDraftt('config_btn_saved') : getDraftt('config_btn_save')}
              </button>
            </div>
          </div>

        </div>
      </main>

      {showConfirmModal && (
        <div className="confirm-modal-overlay" onClick={cancelImport}>
          <div
            className={`confirm-modal-content ${isDark ? 'confirm-modal-dark' : 'confirm-modal-light'}`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={`confirm-modal-icon-wrapper ${isDark ? 'confirm-modal-icon-dark' : 'confirm-modal-icon-light'}`}>
              <Warning size={32} weight="duotone" />
            </div>

            <h3 className={`confirm-modal-title ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
              {getDraftt('confirm_modal_title')}
            </h3>

            <p className={`confirm-modal-body ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {getDraftt('confirm_modal_body')}
            </p>

            <div className={`confirm-modal-file ${isDark ? 'bg-gray-700/50 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
              <span className="confirm-modal-file-icon">
                <FileText size={16} weight="duotone" />
              </span>
              <span className="confirm-modal-file-name">
                {pendingFilePath?.split(/[\\/]/).pop()}
              </span>
            </div>

            <div className={`confirm-modal-note ${isDark ? 'bg-emerald-900/30 text-emerald-300 border-emerald-700' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
              <ShieldCheck size={16} weight="duotone" /> {getDraftt('confirm_modal_safety_note')}
            </div>

            <div className="confirm-modal-actions">
              <button
                type="button"
                onClick={cancelImport}
                className={`confirm-modal-btn confirm-modal-btn-cancel ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                {getDraftt('confirm_modal_cancel')}
              </button>
              <button
                type="button"
                onClick={confirmImport}
                className="confirm-modal-btn confirm-modal-btn-confirm"
              >
                {getDraftt('confirm_modal_confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
