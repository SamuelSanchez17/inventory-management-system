import { useContext, useEffect, useRef, useState } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import { LanguageContext } from '../context/LanguageContext';
import { invoke, isTauri } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import toast from 'react-hot-toast';
import { FolderOpen, Globe, Moon, TextAa } from 'phosphor-react';
import translations from '../translations';
import ImportConfirmModal from '../components/configuration/ImportConfirmModal';

export default function Configuration() {
  const { theme, setTheme, textSize, setTextSize, savePreferences } = useContext(ThemeContext);
  const { language, setLanguage, t } = useContext(LanguageContext);
  const [showSaved, setShowSaved] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingFilePath, setPendingFilePath] = useState(null);

  // ── Draft states ──
  const [draftTheme, setDraftTheme] = useState(theme);
  const [draftLanguage, setDraftLanguage] = useState(language);
  const [draftTextSize, setDraftTextSize] = useState(textSize);

  const initialThemeRef = useRef(theme);
  const initialLanguageRef = useRef(language);
  const initialTextSizeRef = useRef(textSize);

  const hasChanges = draftTheme !== initialThemeRef.current ||
    draftLanguage !== initialLanguageRef.current ||
    draftTextSize !== initialTextSizeRef.current;

  const getActiveDraftTheme = () => {
    if (draftTheme === 'sistema') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'oscuro' : 'claro';
    }
    return draftTheme;
  };

  const getDraftt = (key) => {
    const dict = translations[draftLanguage] || translations.es;
    return dict[key] !== undefined ? dict[key] : key;
  };

  const getDraftFontSize = () => draftTextSize === 'grande' ? '18px' : '16px';

  const isDark = getActiveDraftTheme() === 'oscuro';

  useEffect(() => {
    if (draftTheme !== theme) setTheme(draftTheme);
  }, [draftTheme, theme, setTheme]);

  useEffect(() => {
    if (draftLanguage !== language) setLanguage(draftLanguage);
  }, [draftLanguage, language, setLanguage]);

  useEffect(() => {
    if (draftTextSize !== textSize) setTextSize(draftTextSize);
  }, [draftTextSize, textSize, setTextSize]);

  const handleSave = () => {
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
    setDraftTheme(initialThemeRef.current);
    setDraftLanguage(initialLanguageRef.current);
    setDraftTextSize(initialTextSizeRef.current);
    setTheme(initialThemeRef.current);
    setLanguage(initialLanguageRef.current);
    setTextSize(initialTextSizeRef.current);
    toast(getDraftt('toast_changes_discarded') || 'Cambios descartados', { icon: 'ℹ️' });
  };

  const handleImportDB = async () => {
    if (!isTauri()) return;
    try {
      const filePath = await open({ multiple: false, filters: [{ name: 'Database', extensions: ['db'] }] });
      if (!filePath) { toast(t('toast_import_cancelled'), { icon: 'ℹ️' }); return; }
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
      if (errorStr.includes('FILE_NOT_FOUND')) toast.error(t('toast_import_file_not_found'));
      else if (errorStr.includes('INVALID_EXTENSION')) toast.error(t('toast_import_invalid_ext'));
      else if (errorStr.includes('NOT_SQLITE')) toast.error(t('toast_import_not_sqlite'));
      else if (errorStr.includes('CORRUPT_DB')) toast.error(t('toast_import_corrupt'));
      else if (errorStr.includes('MISSING_TABLE')) toast.error(t('toast_import_missing_table'));
      else toast.error(t('toast_import_error'));
    } finally {
      setIsImporting(false);
      setPendingFilePath(null);
    }
  };

  const cancelImport = () => { setShowConfirmModal(false); setPendingFilePath(null); };

  const OptionButton = ({ value, current, label, description, onClick }) => (
    <button onClick={onClick}
      className={`cursor-pointer p-4 rounded-xl border-2 transition-all duration-200 text-center ${current === value
        ? isDark ? 'border-pink-400 bg-gray-700 shadow-md' : 'border-rose-400 bg-rose-50 shadow-md'
        : isDark ? 'border-gray-600 bg-gray-800 hover:border-gray-500' : 'border-gray-200 bg-white hover:border-rose-200'
      }`}>
      <div className={`font-semibold mb-1 ${isDark ? 'text-pink-400' : 'text-rose-800'}`}>{label}</div>
      {description && <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{description}</div>}
    </button>
  );

  const SectionCard = ({ icon, title, description, children }) => (
    <div className={`rounded-2xl shadow-lg p-8 border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-rose-100'}`}>
      <div className="flex items-start gap-4 mb-6">
        <span className="text-3xl">{icon}</span>
        <div>
          <h2 className={`text-2xl font-bold mb-1 ${isDark ? 'text-pink-400' : 'text-rose-800'}`}>{title}</h2>
          {description && <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>{description}</p>}
        </div>
      </div>
      {children}
    </div>
  );

  return (
    <>
      <main className={`flex-1 p-10 ${isDark ? 'text-gray-100' : 'text-gray-900'}`} style={{ fontSize: getDraftFontSize() }}>
        <h1 className={`text-4xl font-bold mb-10 ${isDark ? 'text-pink-400' : 'text-rose-800'}`}>{getDraftt('config_title')}</h1>

        <div className="flex gap-8 items-start">
          <div className="flex-1 max-w-2xl space-y-8">
            <SectionCard icon={<Moon size={28} weight="duotone" />} title={getDraftt('config_theme_title')} description={getDraftt('config_theme_desc')}>
              <div className="grid grid-cols-3 gap-4">
                <OptionButton value="claro" current={draftTheme} label={getDraftt('config_theme_light')} description={getDraftt('config_theme_light_desc')} onClick={() => setDraftTheme('claro')} />
                <OptionButton value="oscuro" current={draftTheme} label={getDraftt('config_theme_dark')} description={getDraftt('config_theme_dark_desc')} onClick={() => setDraftTheme('oscuro')} />
                <OptionButton value="sistema" current={draftTheme} label={getDraftt('config_theme_system')} description={getDraftt('config_theme_system_desc')} onClick={() => setDraftTheme('sistema')} />
              </div>
            </SectionCard>

            <SectionCard icon={<Globe size={28} weight="duotone" />} title={getDraftt('config_language_title')} description={getDraftt('config_language_desc')}>
              <div className="grid grid-cols-2 gap-4">
                <OptionButton value="es" current={draftLanguage} label={getDraftt('config_language_es')} description={getDraftt('config_language_es_desc')} onClick={() => setDraftLanguage('es')} />
                <OptionButton value="en" current={draftLanguage} label={getDraftt('config_language_en')} description={getDraftt('config_language_en_desc')} onClick={() => setDraftLanguage('en')} />
              </div>
            </SectionCard>

            <SectionCard icon={<TextAa size={28} weight="duotone" />} title={getDraftt('config_text_size_title')} description={getDraftt('config_text_size_desc')}>
              <div className="grid grid-cols-2 gap-4">
                <OptionButton value="normal" current={draftTextSize} label={getDraftt('config_text_normal')} description={getDraftt('config_text_preview')} onClick={() => setDraftTextSize('normal')} />
                <OptionButton value="grande" current={draftTextSize} label={getDraftt('config_text_large')} description={getDraftt('config_text_preview')} onClick={() => setDraftTextSize('grande')} />
              </div>
            </SectionCard>

            <SectionCard icon={<FolderOpen size={28} weight="duotone" />} title={getDraftt('config_import_title')} description={getDraftt('config_import_desc')}>
              <div className={`rounded-xl p-4 mb-4 text-sm ${isDark ? 'bg-amber-900/30 text-amber-300 border border-amber-700' : 'bg-amber-50 text-amber-800 border border-amber-200'}`}>
                {getDraftt('config_import_warning')}
              </div>
              <button type="button" onClick={handleImportDB} disabled={isImporting}
                className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-center font-semibold ${isDark ? 'border-gray-600 bg-gray-700 text-gray-200 hover:border-pink-400 hover:bg-gray-600' : 'border-gray-200 bg-white text-gray-700 hover:border-rose-300 hover:bg-rose-50'} ${isImporting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                {isImporting ? '...' : getDraftt('config_import_btn')}
              </button>
            </SectionCard>

            <div className="flex justify-end gap-3">
              {hasChanges && (
                <button onClick={handleCancel}
                  className={`cursor-pointer px-6 py-3 rounded-xl font-semibold transition-all duration-300 border-2 ${isDark ? 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'}`}>
                  {getDraftt('config_btn_cancel') || 'Descartar'}
                </button>
              )}
              <button onClick={handleSave}
                className={`px-8 py-3 rounded-xl font-semibold transition-all duration-300 transform ${showSaved ? 'bg-green-500 text-white shadow-lg scale-105' : !hasChanges ? isDark ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-300 text-gray-600 cursor-not-allowed' : isDark ? 'bg-pink-600 text-white shadow-lg hover:shadow-xl hover:scale-105 cursor-pointer' : 'bg-rose-500 text-white shadow-lg hover:shadow-xl hover:scale-105 cursor-pointer'}`}
                disabled={!hasChanges && !showSaved}>
                {showSaved ? getDraftt('config_btn_saved_success') : !hasChanges ? getDraftt('config_btn_saved') : getDraftt('config_btn_save')}
              </button>
            </div>
          </div>
        </div>
      </main>

      <ImportConfirmModal
        open={showConfirmModal}
        filePath={pendingFilePath}
        onConfirm={confirmImport}
        onCancel={cancelImport}
        t={getDraftt}
        isDark={isDark}
      />
    </>
  );
}
