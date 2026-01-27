import { useState } from 'react';
import Dashboard from './pages/dashboard';
import Products from './pages/products';
import './app.css';

function App() {
  const [currentPage, setCurrentPage]  = useState('dashboard');

  return (
    <>
      {currentPage === 'dashboard' && <Dashboard onNavigate={setCurrentPage} />}
      {currentPage === 'products' && <Products onNavigate={setCurrentPage} />}
    </>
  );
}

export default App;
