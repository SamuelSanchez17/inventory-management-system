import { useContext, useState, useEffect, useRef } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import { LanguageContext } from '../context/LanguageContext';
import { invoke, isTauri } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import toast from 'react-hot-toast';
import Sidebar from '../components/sidebar';
import { Camera, FileText, FolderOpen, Globe, Moon, ShieldCheck, TextAa, UserCircle, Warning } from 'phosphor-react';

export default function Configuration({ onNavigate, currentPage, isSidebarCollapsed, toggleSidebar, profile, onProfileSaved }) {
  const { theme, setTheme, textSize, setTextSize, savePreferences, isSaved, getActiveTheme } = useContext(ThemeContext);
  const { language, setLanguage, t } = useContext(LanguageContext);
  const [showSaved, setShowSaved] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingFilePath, setPendingFilePath] = useState(null);
  const isDark = getActiveTheme() === 'oscuro';

  // ── Profile state ──
  const [profileName, setProfileName] = useState('');
  const [profileRole, setProfileRole] = useState('');
  const [profilePhotoPreview, setProfilePhotoPreview] = useState(null);
  const [profilePhotoFile, setProfilePhotoFile] = useState(null);
  const [profileMiniatura, setProfileMiniatura] = useState(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const profilePhotoRef = useRef(null);

  // Cargar perfil al montar
  useEffect(() => {
    if (profile) {
      setProfileName(profile.nombre || '');
      setProfileRole(profile.cargo || '');
      if (profile.miniatura_base64) {
        setProfilePhotoPreview(`data:image/jpeg;base64,${profile.miniatura_base64}`);
      }
    }
  }, [profile]);

  const makeProfileThumbnail = (file, maxSize = 200) =>
    new Promise((resolve, reject) => {
      const img = new window.Image();
      const reader = new FileReader();
      reader.onload = (event) => {
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const scale = Math.min(maxSize / img.width, maxSize / img.height);
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const base64 = canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
          resolve(base64);
        };
        img.onerror = reject;
        img.src = event.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleProfilePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePhotoFile(file);
      makeProfileThumbnail(file)
        .then((base64) => setProfileMiniatura(base64))
        .catch(() => setProfileMiniatura(null));
      const reader = new FileReader();
      reader.onload = (event) => {
        setProfilePhotoPreview(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    if (!isTauri()) return;
    setIsSavingProfile(true);

    try {
      let imageBytes = null;
      let imageExt = null;

      if (profilePhotoFile) {
        const arrayBuffer = await profilePhotoFile.arrayBuffer();
        imageBytes = Array.from(new Uint8Array(arrayBuffer));
        imageExt = profilePhotoFile.name.split('.').pop();
      }

      await invoke('save_perfil', {
        nombre: profileName,
        cargo: profileRole,
        imageBytes,
        imageExt,
        miniaturaBase64: profileMiniatura,
      });

      toast.success(t('toast_profile_saved'));
      setProfilePhotoFile(null);
      if (onProfileSaved) onProfileSaved();
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error(t('toast_profile_error'));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSave = () => {
    savePreferences();
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 2000);
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
    <div className={`min-h-screen flex ${isDark ? 'bg-gray-900' : 'bg-rose-50'}`}>
      {/* Sidebar */}
      <Sidebar onNavigate={onNavigate} activePage={currentPage} isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} profile={profile} />

      {/* Main content */}
      <main className={`flex-1 p-10 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
        <h1 className={`text-4xl font-bold mb-10 ${isDark ? 'text-pink-400' : 'text-rose-800'}`}>{t('config_title')}</h1>

        {/* Layout de dos columnas: Ajustes (izq) + Perfil (der) */}
        <div className="flex gap-8 items-start">
          {/* Columna izquierda - Ajustes generales */}
          <div className="flex-1 max-w-2xl space-y-8">
            {/* Sección de Tema */}
            <div className={`rounded-2xl shadow-lg p-8 border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-rose-100'}`}>
              <div className="flex items-start gap-4 mb-6">
                <span className="text-3xl">
                  <Moon size={28} weight="duotone" />
                </span>
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
                <span className="text-3xl">
                  <Globe size={28} weight="duotone" />
                </span>
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
                <span className="text-3xl">
                  <TextAa size={28} weight="duotone" />
                </span>
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

            {/* Sección de Restaurar Datos */}
            <div className={`rounded-2xl shadow-lg p-8 border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-rose-100'}`}>
              <div className="flex items-start gap-4 mb-4">
                <span className="text-3xl">
                  <FolderOpen size={28} weight="duotone" />
                </span>
                <div>
                  <h2 className={`text-2xl font-bold mb-1 ${isDark ? 'text-pink-400' : 'text-rose-800'}`}>{t('config_import_title')}</h2>
                  <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>{t('config_import_desc')}</p>
                </div>
              </div>

              <div className={`rounded-xl p-4 mb-4 text-sm ${isDark ? 'bg-amber-900/30 text-amber-300 border border-amber-700' : 'bg-amber-50 text-amber-800 border border-amber-200'}`}>
                {t('config_import_warning')}
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
                {isImporting ? '...' : t('config_import_btn')}
              </button>
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

          {/* Columna derecha - Mi Perfil (sticky) */}
          <div className="w-80 shrink-0 sticky top-10">
            <div className={`rounded-2xl shadow-lg p-6 border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-rose-100'}`}>
              <div className="flex items-center gap-3 mb-6">
                <UserCircle size={24} weight="duotone" className={isDark ? 'text-pink-400' : 'text-rose-700'} />
                <h2 className={`text-lg font-bold ${isDark ? 'text-pink-400' : 'text-rose-800'}`}>{t('profile_title')}</h2>
              </div>

              <div className="flex flex-col items-center gap-5">
                {/* Foto de perfil */}
                <div className="flex flex-col items-center gap-2.5">
                  <div
                    className={`w-24 h-24 rounded-full overflow-hidden border-4 flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-105 ${
                      isDark
                        ? 'border-gray-600 bg-gradient-to-br from-gray-700 to-gray-600'
                        : 'border-rose-200 bg-gradient-to-br from-rose-200 to-rose-300'
                    }`}
                    onClick={() => profilePhotoRef.current?.click()}
                  >
                    {profilePhotoPreview ? (
                      <img src={profilePhotoPreview} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <UserCircle size={48} weight="duotone" className={isDark ? 'text-gray-400' : 'text-rose-400'} />
                    )}
                  </div>
                  <input
                    type="file"
                    ref={profilePhotoRef}
                    onChange={handleProfilePhotoUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => profilePhotoRef.current?.click()}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                      isDark
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 ring-1 ring-gray-600'
                        : 'bg-rose-50 text-rose-700 hover:bg-rose-100 ring-1 ring-rose-200'
                    }`}
                  >
                    <Camera size={14} weight="duotone" />
                    {profilePhotoPreview ? t('profile_photo_change') : t('profile_photo_upload')}
                  </button>
                </div>

                {/* Campos de texto */}
                <div className="w-full space-y-3">
                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {t('profile_name_label')}
                    </label>
                    <input
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      placeholder={t('profile_name_placeholder')}
                      className={`w-full px-3 py-2.5 rounded-xl border-2 text-sm transition-all duration-200 outline-none ${
                        isDark
                          ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-500 focus:border-pink-400'
                          : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-rose-400'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {t('profile_role_label')}
                    </label>
                    <input
                      type="text"
                      value={profileRole}
                      onChange={(e) => setProfileRole(e.target.value)}
                      placeholder={t('profile_role_placeholder')}
                      className={`w-full px-3 py-2.5 rounded-xl border-2 text-sm transition-all duration-200 outline-none ${
                        isDark
                          ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-500 focus:border-pink-400'
                          : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-rose-400'
                      }`}
                    />
                  </div>
                </div>

                {/* Botón guardar perfil */}
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={isSavingProfile}
                  className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 ${
                    isSavingProfile
                      ? 'opacity-50 cursor-not-allowed'
                      : isDark
                        ? 'bg-pink-600 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] cursor-pointer'
                        : 'bg-rose-500 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] cursor-pointer'
                  }`}
                >
                  {isSavingProfile ? t('profile_btn_saving') : t('profile_btn_save')}
                </button>
              </div>

              {/* Descripción sutil */}
              <p className={`text-[11px] text-center mt-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                {t('profile_desc')}
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* ── Modal de confirmación de restauración ── */}
      {showConfirmModal && (
        <div
          className="confirm-modal-overlay"
          onClick={cancelImport}
        >
          <div
            className={`confirm-modal-content ${
              isDark ? 'confirm-modal-dark' : 'confirm-modal-light'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icono de advertencia */}
            <div className={`confirm-modal-icon-wrapper ${
              isDark ? 'confirm-modal-icon-dark' : 'confirm-modal-icon-light'
            }`}>
              <Warning size={32} weight="duotone" />
            </div>

            {/* Título */}
            <h3 className={`confirm-modal-title ${
              isDark ? 'text-gray-100' : 'text-gray-900'
            }`}>
              {t('confirm_modal_title')}
            </h3>

            {/* Cuerpo */}
            <p className={`confirm-modal-body ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {t('confirm_modal_body')}
            </p>

            {/* Detalle archivo */}
            <div className={`confirm-modal-file ${
              isDark ? 'bg-gray-700/50 text-gray-300' : 'bg-gray-100 text-gray-700'
            }`}>
              <span className="confirm-modal-file-icon">
                <FileText size={16} weight="duotone" />
              </span>
              <span className="confirm-modal-file-name">
                {pendingFilePath?.split(/[\\/]/).pop()}
              </span>
            </div>

            {/* Nota de seguridad */}
            <div className={`confirm-modal-note ${
              isDark
                ? 'bg-emerald-900/30 text-emerald-300 border-emerald-700'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}>
              <ShieldCheck size={16} weight="duotone" /> {t('confirm_modal_safety_note')}
            </div>

            {/* Botones */}
            <div className="confirm-modal-actions">
              <button
                type="button"
                onClick={cancelImport}
                className={`confirm-modal-btn confirm-modal-btn-cancel ${
                  isDark
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t('confirm_modal_cancel')}
              </button>
              <button
                type="button"
                onClick={confirmImport}
                className="confirm-modal-btn confirm-modal-btn-confirm"
              >
                {t('confirm_modal_confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
