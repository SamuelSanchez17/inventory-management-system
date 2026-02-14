import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import Dashboard from './pages/dashboard';
import Products from './pages/products';
import Sales from './pages/sales';
import Reports from './pages/reports';
import Configuration from './pages/configuration';
import Sidebar from './components/sidebar';
import { ThemeProvider } from './context/ThemeContext';
import './app.css';

function App() {
  const [currentPage, setCurrentPage]  = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

  return (
    <ThemeProvider>
      <>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        {currentPage === 'dashboard' && <Dashboard onNavigate={setCurrentPage} currentPage={currentPage} isSidebarCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />}
        {currentPage === 'products' && <Products onNavigate={setCurrentPage} currentPage={currentPage} isSidebarCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />}
        {currentPage === 'sales' && <Sales onNavigate={setCurrentPage} currentPage={currentPage} isSidebarCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />}
        {currentPage === 'reports' && <Reports onNavigate={setCurrentPage} currentPage={currentPage} isSidebarCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />}
        {currentPage === 'settings' && <Configuration onNavigate={setCurrentPage} currentPage={currentPage} isSidebarCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />}
      </>
    </ThemeProvider>
  );
}

export default App;
