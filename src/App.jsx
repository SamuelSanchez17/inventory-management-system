import { useState, useEffect, useCallback } from 'react';
import { Toaster } from 'react-hot-toast';
import { invoke, isTauri } from '@tauri-apps/api/core';
import Dashboard from './pages/dashboard';
import Products from './pages/products';
import Sales from './pages/sales';
import Reports from './pages/reports';
import Configuration from './pages/configuration';
import Sidebar from './components/sidebar';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import './app.css';

function App() {
  const [currentPage, setCurrentPage]  = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [profile, setProfile] = useState(null);

  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

  const loadProfile = useCallback(async () => {
    if (!isTauri()) return;
    try {
      const data = await invoke('get_perfil');
      setProfile(data);
    } catch (err) {
      console.error('Error loading profile:', err);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  return (
    <LanguageProvider>
    <ThemeProvider>
      <>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        {currentPage === 'dashboard' && <Dashboard onNavigate={setCurrentPage} currentPage={currentPage} isSidebarCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} profile={profile} />}
        {currentPage === 'products' && <Products onNavigate={setCurrentPage} currentPage={currentPage} isSidebarCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} profile={profile} />}
        {currentPage === 'sales' && <Sales onNavigate={setCurrentPage} currentPage={currentPage} isSidebarCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} profile={profile} />}
        {currentPage === 'reports' && <Reports onNavigate={setCurrentPage} currentPage={currentPage} isSidebarCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} profile={profile} />}
        {currentPage === 'settings' && <Configuration onNavigate={setCurrentPage} currentPage={currentPage} isSidebarCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} profile={profile} onProfileSaved={loadProfile} />}
      </>
    </ThemeProvider>
    </LanguageProvider>
  );
}

export default App;
