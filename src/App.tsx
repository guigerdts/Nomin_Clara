import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ToastContainer } from './components/Toast';
import { CalculatorPage } from './pages/CalculatorPage/CalculatorPage';

const ComparePage = lazy(() => import('./pages/ComparePage/ComparePage').then(m => ({ default: m.ComparePage })));

function App() {
  return (
    <BrowserRouter>
      <Header />
      <main className="container">
        <Routes>
          <Route path="/" element={<CalculatorPage />} />
          <Route path="/compare" element={
            <Suspense fallback={<div className="container" style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Cargando...</div>}>
              <ComparePage />
            </Suspense>
          } />
        </Routes>
      </main>
      <Footer />
      <ToastContainer />
    </BrowserRouter>
  );
}

export { App };
