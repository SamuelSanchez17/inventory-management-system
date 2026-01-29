import { useState } from 'react';
import Dashboard from './pages/dashboard';
import Products from './pages/products';
import Sidebar from './components/sidebar';
import './app.css';

function App() {
  const [currentPage, setCurrentPage]  = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

  return (
    <>
      {currentPage === 'dashboard' && <Dashboard onNavigate={setCurrentPage} currentPage={currentPage} isSidebarCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />}
      {currentPage === 'products' && <Products onNavigate={setCurrentPage} currentPage={currentPage} isSidebarCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />}
      {currentPage === 'sales' && <div className="min-h-screen flex bg-rose-50"><Sidebar onNavigate={setCurrentPage} activePage={currentPage} isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} /><main className="flex-1 p-10"><h1>Ventas</h1></main></div>}
      {currentPage === 'reports' && <div className="min-h-screen flex bg-rose-50"><Sidebar onNavigate={setCurrentPage} activePage={currentPage} isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} /><main className="flex-1 p-10"><h1>Reportes</h1></main></div>}
      {currentPage === 'settings' && <div className="min-h-screen flex bg-rose-50"><Sidebar onNavigate={setCurrentPage} activePage={currentPage} isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} /><main className="flex-1 p-10"><h1>Configuración</h1></main></div>}
    </>
  );
}

export default App;
