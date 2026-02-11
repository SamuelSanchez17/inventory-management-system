import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import Dashboard from './pages/dashboard';
import Products from './pages/products';
import Sales from './pages/sales';
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
        {currentPage === 'reports' && <div className="min-h-screen flex bg-rose-50"><Sidebar onNavigate={setCurrentPage} activePage={currentPage} isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} /><main className="flex-1 p-10"><h1>Reportes</h1></main></div>}
        {currentPage === 'settings' && <Configuration onNavigate={setCurrentPage} currentPage={currentPage} isSidebarCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />}
      </>
    </ThemeProvider>
  );
}

export default App;
