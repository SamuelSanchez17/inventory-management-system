import { useState, useEffect, useCallback, useContext, useMemo, useRef } from 'react';
import { Toaster } from 'react-hot-toast';
import { invoke, isTauri } from '@tauri-apps/api/core';
import { getVersion } from '@tauri-apps/api/app';
import { check } from '@tauri-apps/plugin-updater';
import toast from 'react-hot-toast';
import Dashboard from './pages/dashboard';
import Products from './pages/products';
import Sales from './pages/sales';
import Reports from './pages/reports';
import Configuration from './pages/configuration';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeContext } from './context/ThemeContext';
import { LanguageContext } from './context/LanguageContext';
import UpdateModal from './components/updateModal';
import './app.css';

const RECHECK_INTERVAL_MS = 8 * 60 * 60 * 1000; // 8 horas

function AppShell() {
  const { t } = useContext(LanguageContext);
  const { getActiveTheme } = useContext(ThemeContext);
  const isDark = getActiveTheme() === 'oscuro';
  const [currentPage, setCurrentPage]  = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [profile, setProfile] = useState(null);
  const [currentVersion, setCurrentVersion] = useState('');
  const [availableVersion, setAvailableVersion] = useState('');
  const [updateInfo, setUpdateInfo] = useState(null);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [updateStage, setUpdateStage] = useState('idle');
  const [updateProgress, setUpdateProgress] = useState(0);
  const [updateEta, setUpdateEta] = useState('');

  // ── Patch‑notes post‑update ──
  const [patchNotesData, setPatchNotesData] = useState(null);
  const [showPatchNotes, setShowPatchNotes] = useState(false);

  // Ref para mantener el objeto Update descargado (para instalar al cerrar)
  const deferredUpdateRef = useRef(null);

  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

  // ── Profile ──
  const loadProfile = useCallback(async () => {
    if (!isTauri()) return;
    try {
      const data = await invoke('get_perfil');
      setProfile(data);
    } catch (err) {
      console.error('Error loading profile:', err);
    }
  }, []);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  // ── Versión actual ──
  useEffect(() => {
    if (!isTauri()) return;
    getVersion()
      .then((v) => setCurrentVersion(v))
      .catch(() => setCurrentVersion(''));
  }, []);

  // ── Al abrir: mostrar notas del parche si se actualizó en segundo plano ──
  useEffect(() => {
    try {
      const raw = localStorage.getItem('pendingPatchNotes');
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data && data.version) {
        setPatchNotesData(data);
        setShowPatchNotes(true);
        localStorage.removeItem('pendingPatchNotes');
      }
    } catch { /* ignore */ }
  }, []);

  // ── Check de actualizaciones ──
  const checkForUpdates = useCallback(async () => {
    if (!isTauri()) return;
    // Si ya hay un update descargado pendiente, no volver a preguntar
    if (deferredUpdateRef.current) return;

    try {
      const update = await check();
      if (!update || !update.available) {
        setAvailableVersion('');
        return;
      }

      setUpdateInfo(update);
      setAvailableVersion(update.version || '');
      setUpdateStage('ready');
      setUpdateProgress(0);
      setUpdateEta('');
      setUpdateModalOpen(true);
    } catch (error) {
      console.error('Updater check failed:', error);
    }
  }, []);

  // Check al iniciar + cada 8 horas
  useEffect(() => {
    checkForUpdates();
    const interval = setInterval(checkForUpdates, RECHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [checkForUpdates]);

  // ── "Actualizar ahora" → descarga + instala + reinicia ──
  const handleStartUpdate = async () => {
    if (!updateInfo) return;
    setUpdateStage('downloading');
    setUpdateProgress(0);
    setUpdateEta('');

    try {
      // Guardar notas para mostrar al reabrir
      localStorage.setItem('pendingPatchNotes', JSON.stringify({
        version: updateInfo.version || availableVersion,
        body: updateInfo.body || '',
      }));

      await updateInfo.downloadAndInstall();
      setUpdateStage('installing');

      // Reiniciar la app
      const { relaunch } = await import('@tauri-apps/plugin-process');
      await relaunch();
    } catch (error) {
      console.error('Update failed:', error);
      setUpdateStage('ready');
      localStorage.removeItem('pendingPatchNotes');
      toast.error(t('update_install_error'));
    }
  };

  // ── "Después" → descarga en background, instala al cerrar ──
  const handleDeferUpdate = async () => {
    setUpdateModalOpen(false);

    if (!updateInfo) return;

    // Guardar notas para mostrar en el siguiente inicio
    localStorage.setItem('pendingPatchNotes', JSON.stringify({
      version: updateInfo.version || availableVersion,
      body: updateInfo.body || '',
    }));

    try {
      toast(t('update_downloading_bg'), { icon: '⬇️', duration: 4000 });
      await updateInfo.download();
      deferredUpdateRef.current = updateInfo;
      toast.success(t('update_ready_on_close'), { duration: 5000 });
    } catch (error) {
      console.error('Background download failed:', error);
      deferredUpdateRef.current = null;
      localStorage.removeItem('pendingPatchNotes');
    }
  };

  // ── Instalar al cerrar la ventana ──
  useEffect(() => {
    if (!isTauri()) return;
    let unlisten;

    (async () => {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      const appWindow = getCurrentWindow();

      unlisten = await appWindow.onCloseRequested(async (event) => {
        // Solo prevenir cierre si hay update pendiente
        if (deferredUpdateRef.current) {
          event.preventDefault();
          try {
            await deferredUpdateRef.current.install();
          } catch (err) {
            console.error('Install on close failed:', err);
          }
        }
        // Si no hay update, dejar que cierre naturalmente (sin preventDefault)
      });
    })();

    return () => { if (unlisten) unlisten(); };
  }, []);

  const handleCloseModal = () => {
    if (updateStage === 'downloading' || updateStage === 'installing') return;
    setUpdateModalOpen(false);
  };

  const handleClosePatchNotes = () => {
    setShowPatchNotes(false);
    setPatchNotesData(null);
  };

  const updateSize = useMemo(() => {
    if (!updateInfo) return null;
    return updateInfo?.manifest?.size || updateInfo?.size || null;
  }, [updateInfo]);

  const updateNotes = updateInfo?.body || '';

  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      {currentPage === 'dashboard' && <Dashboard onNavigate={setCurrentPage} currentPage={currentPage} isSidebarCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} profile={profile} />}
      {currentPage === 'products' && <Products onNavigate={setCurrentPage} currentPage={currentPage} isSidebarCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} profile={profile} />}
      {currentPage === 'sales' && <Sales onNavigate={setCurrentPage} currentPage={currentPage} isSidebarCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} profile={profile} />}
      {currentPage === 'reports' && <Reports onNavigate={setCurrentPage} currentPage={currentPage} isSidebarCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} profile={profile} />}
      {currentPage === 'settings' && (
        <Configuration
          onNavigate={setCurrentPage}
          currentPage={currentPage}
          isSidebarCollapsed={isSidebarCollapsed}
          toggleSidebar={toggleSidebar}
          profile={profile}
          onProfileSaved={loadProfile}
        />
      )}

      {/* Modal de actualización disponible */}
      <UpdateModal
        mode="update"
        open={updateModalOpen}
        stage={updateStage}
        currentVersion={currentVersion}
        nextVersion={availableVersion || updateInfo?.version}
        updateSize={updateSize}
        notes={updateNotes}
        isDark={isDark}
        progressPercent={updateProgress}
        etaLabel={updateEta}
        onConfirm={handleStartUpdate}
        onDefer={handleDeferUpdate}
        onClose={handleCloseModal}
        t={t}
      />

      {/* Modal de notas del parche (post‑actualización) */}
      <UpdateModal
        mode="patchNotes"
        open={showPatchNotes}
        stage="idle"
        currentVersion={currentVersion}
        nextVersion={patchNotesData?.version}
        notes={patchNotesData?.body || ''}
        isDark={isDark}
        onClose={handleClosePatchNotes}
        onConfirm={handleClosePatchNotes}
        t={t}
      />
    </>
  );
}

function App() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <AppShell />
      </ThemeProvider>
    </LanguageProvider>
  );
}

export default App;
